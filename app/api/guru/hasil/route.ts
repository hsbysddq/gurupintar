import type { NextRequest } from 'next/server';
import { kelompokkanHasil, ringkasMateri } from '@/lib/ringkasan-hasil';
import { skemaQueryHasil } from '@/lib/skema-api';
import { cadanganTersedia } from '@/lib/soal-guru';
import { cariSoalTersulit } from '@/lib/soal-tersulit';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { HasilGuru, Kelompok, StatusMateri, StatusSesi } from '@/lib/tipe';

// GET /api/guru/hasil?sesi= (PRD F-5, architecture.md 6.1 dan 7.2)
// Kunci jawaban tidak ikut dikirim; miskonsepsi hanya teks untuk soal tersulit.
export async function GET(request: NextRequest) {
  const input = skemaQueryHasil.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const sesiId = input.data.sesi;

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada, kelas_id, topik_id')
      .eq('id', sesiId)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const [kelas, topik, siswa, hasil, soal, jawaban, materi] = await Promise.all([
      db.from('kelas').select('nama').eq('id', sesi.kelas_id).single(),
      db.from('topik').select('nama').eq('id', sesi.topik_id).single(),
      db.from('siswa').select('id, nama').eq('kelas_id', sesi.kelas_id),
      db.from('hasil_siswa').select('siswa_id, skor, total, kelompok').eq('sesi_id', sesiId),
      db.from('soal').select('id, nomor, teks, miskonsepsi').eq('topik_id', sesi.topik_id),
      db.from('jawaban').select('soal_id, pilihan, benar').eq('sesi_id', sesiId),
      db.from('materi').select('kelompok, status').eq('sesi_id', sesiId),
    ]);
    for (const r of [kelas, topik, siswa, hasil, soal, jawaban, materi]) {
      if (r.error) return petakanErrorDb(r.error);
    }

    const namaSiswa = new Map<string, string>(siswa.data!.map((s) => [s.id, s.nama]));
    const kelompok = kelompokkanHasil(
      hasil.data!.map((h) => ({
        siswaId: h.siswa_id,
        nama: namaSiswa.get(h.siswa_id) ?? '',
        skor: h.skor,
        total: h.total,
        kelompok: h.kelompok as Kelompok,
      })),
    );

    const soalTersulit = cariSoalTersulit(
      soal.data!.map((s) => ({
        id: s.id,
        nomor: s.nomor,
        teks: s.teks,
        miskonsepsi: (s.miskonsepsi ?? {}) as Record<string, string>,
      })),
      jawaban.data!.map((j) => ({ soalId: j.soal_id, pilihan: j.pilihan, benar: j.benar })),
    );

    const respons: HasilGuru = {
      sesi: {
        id: sesi.id,
        kodeKelas: sesi.kode_kelas,
        status: sesi.status as StatusSesi,
        namaKelas: kelas.data!.nama,
        namaTopik: topik.data!.nama,
        dibuatPada: sesi.dibuat_pada,
        cadanganTersedia: cadanganTersedia(sesi.topik_id),
      },
      jumlahSiswa: siswa.data!.length,
      jumlahMenjawab: hasil.data!.length,
      kelompok,
      soalTersulit,
      ...ringkasMateri(
        kelompok,
        materi.data!.map((m) => ({ kelompok: m.kelompok as Kelompok, status: m.status as StatusMateri })),
      ),
    };
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
