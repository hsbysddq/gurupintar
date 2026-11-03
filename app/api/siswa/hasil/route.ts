import type { NextRequest } from 'next/server';
import { skemaQuerySoal } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { KodePilihan, PilihanSoal, RincianJawabanSiswa } from '@/lib/tipe';

type KelasRingkas = { nama: string; mapel: string } | null;
type TopikRingkas = { nama: string } | null;

type BarisJawaban = {
  soal_id: string;
  pilihan: string;
  benar: boolean;
};

type BarisSoal = {
  id: string;
  nomor: number;
  teks: string;
  pilihan: PilihanSoal[];
  kunci: string;
};

// GET /api/siswa/hasil?sesi=: rincian per soal untuk percobaan terakhir siswa pada satu kuis.
// Kunci hanya dikirim setelah siswa punya hasil; label kelompok tidak pernah dikirim (D-2).
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaQuerySoal.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('id, kelas_id, topik_id, kelas(nama, mapel), topik(nama)')
      .eq('id', input.data.sesi)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    if (!(await anggotaKelas(db, auth.profil.id, sesi.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    const hasil = await db
      .from('hasil_siswa')
      .select('skor, total, dikirim_pada')
      .eq('sesi_id', input.data.sesi)
      .eq('siswa_id', auth.profil.id)
      .maybeSingle();
    if (hasil.error) return petakanErrorDb(hasil.error);
    if (!hasil.data) return responsError('Hasil kuis belum tersedia.', 404);

    const [jawaban, soal] = await Promise.all([
      db
        .from('jawaban')
        .select('soal_id, pilihan, benar')
        .eq('sesi_id', input.data.sesi)
        .eq('siswa_id', auth.profil.id),
      db
        .from('soal')
        .select('id, nomor, teks, pilihan, kunci')
        .eq('topik_id', sesi.topik_id)
        .order('nomor'),
    ]);
    if (jawaban.error) return petakanErrorDb(jawaban.error);
    if (soal.error) return petakanErrorDb(soal.error);

    const petaJawaban = new Map((jawaban.data as BarisJawaban[]).map((j) => [j.soal_id, j]));
    const kelas = sesi.kelas as unknown as KelasRingkas;
    const topik = sesi.topik as unknown as TopikRingkas;

    const respons: RincianJawabanSiswa = {
      sesi: {
        id: sesi.id as string,
        kelasId: sesi.kelas_id as string,
        namaKelas: kelas?.nama ?? 'Kelas',
        namaMapel: kelas?.mapel ?? 'Mata pelajaran',
        namaTopik: topik?.nama ?? 'Kuis',
        dikirimPada: hasil.data.dikirim_pada as string,
      },
      skor: hasil.data.skor as number,
      total: hasil.data.total as number,
      soal: (soal.data as BarisSoal[]).map((s) => {
        const j = petaJawaban.get(s.id);
        return {
          id: s.id,
          nomor: s.nomor,
          teks: s.teks,
          pilihan: s.pilihan,
          pilihanSiswa: (j?.pilihan as KodePilihan | undefined) ?? null,
          kunci: s.kunci as KodePilihan,
          benar: j?.benar ?? false,
        };
      }),
    };

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
