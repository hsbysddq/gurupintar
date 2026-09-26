import type { NextRequest } from 'next/server';
import { skemaQuerySesi } from '@/lib/skema-api';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, PESAN_SESI_DITUTUP, responsError, responsOk } from '@/lib/server/respons';
import type { SesiUntukSiswa, StatusSesi } from '@/lib/tipe';

const PESAN_KODE_TIDAK_DITEMUKAN = 'Kode kelas tidak ditemukan. Periksa lagi kode dari gurumu.';

// GET /api/sesi?kode= (PRD F-1)
export async function GET(request: NextRequest) {
  const input = skemaQuerySesi.safeParse({ kode: request.nextUrl.searchParams.get('kode') ?? '' });
  if (!input.success) return responsError(PESAN_KODE_TIDAK_DITEMUKAN, 400);

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, kelas_id, topik_id')
      .eq('kode_kelas', input.data.kode)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_KODE_TIDAK_DITEMUKAN, 404);
    if (sesi.status !== 'aktif') return responsError(PESAN_SESI_DITUTUP, 409);

    const [kelas, topik, siswa] = await Promise.all([
      db.from('kelas').select('nama').eq('id', sesi.kelas_id).single(),
      db.from('topik').select('nama').eq('id', sesi.topik_id).single(),
      db.from('siswa').select('id, nama').eq('kelas_id', sesi.kelas_id).order('nama'),
    ]);
    if (kelas.error) return petakanErrorDb(kelas.error);
    if (topik.error) return petakanErrorDb(topik.error);
    if (siswa.error) return petakanErrorDb(siswa.error);

    const respons: SesiUntukSiswa = {
      sesi: {
        id: sesi.id,
        kodeKelas: sesi.kode_kelas,
        status: sesi.status as StatusSesi,
        namaKelas: kelas.data.nama,
        namaTopik: topik.data.nama,
      },
      siswa: siswa.data.map((s) => ({ id: s.id, nama: s.nama })),
    };
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
