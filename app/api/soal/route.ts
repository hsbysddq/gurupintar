import type { NextRequest } from 'next/server';
import { skemaQuerySoal } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { bacaBlokir } from '@/lib/server/blokir';
import { statusAksesSesi } from '@/lib/server/jadwal-kuis';
import { bacaSoalTopik } from '@/lib/server/soal-tka-db';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_DIBLOKIR,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_BELUM_DIBUKA,
  PESAN_SESI_DITUTUP,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { SoalUntukSiswa } from '@/lib/tipe';

// GET /api/soal?sesi= (PRD F-3)
// Kolom kunci dan miskonsepsi sengaja tidak di-select agar tidak pernah sampai ke browser (AC-3.5).
// Siswa hanya boleh membaca soal dari kelas tempat ia terdaftar.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaQuerySoal.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('id, topik_id, kelas_id, status')
      .eq('id', input.data.sesi)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const akses = await statusAksesSesi(db, { id: sesi.id, status: sesi.status });
    if (akses.status === 'terjadwal') return responsError(PESAN_SESI_BELUM_DIBUKA, 409);
    if (akses.status !== 'aktif') return responsError(PESAN_SESI_DITUTUP, 409);

    if (!(await anggotaKelas(db, auth.profil.id, sesi.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    // Siswa yang diblokir tidak dilayani sampai guru membuka blokirnya (423 Locked).
    if ((await bacaBlokir(db, input.data.sesi, auth.profil.id))?.terblokir) return responsError(PESAN_DIBLOKIR, 423);

    const soal = await bacaSoalTopik(db, sesi.topik_id, { sertakanRahasia: false });
    if (soal.error || !soal.data) return petakanErrorDb(soal.error);

    const respons: SoalUntukSiswa[] = soal.data.map((s) => ({
      id: s.id,
      nomor: s.nomor,
      tipe: s.tipe,
      teks: s.teks,
      gambar: s.gambar,
      pilihan: s.pilihan,
    }));
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
