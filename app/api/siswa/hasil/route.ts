import type { NextRequest } from 'next/server';
import { skemaQuerySoal } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { bacaJawabanSesi, bacaSoalTopik } from '@/lib/server/soal-tka-db';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { RincianJawabanSiswa } from '@/lib/tipe';

type KelasRingkas = { nama: string; mapel: string } | null;
type TopikRingkas = { nama: string } | null;

// GET /api/siswa/hasil?sesi=: rincian per soal untuk percobaan terakhir siswa pada satu kuis.
// Kunci hanya dikirim setelah siswa punya hasil; pedoman esai disembunyikan selama belum dinilai guru.
// Label kelompok tidak pernah dikirim (D-2).
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
      bacaJawabanSesi(db, input.data.sesi, auth.profil.id),
      bacaSoalTopik(db, sesi.topik_id, { sertakanRahasia: true }),
    ]);
    if (jawaban.error || !jawaban.data) return petakanErrorDb(jawaban.error);
    if (soal.error || !soal.data) return petakanErrorDb(soal.error);

    const petaJawaban = new Map(jawaban.data.map((j) => [j.soal_id, j]));
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
      soal: soal.data.map((s) => {
        const j = petaJawaban.get(s.id);
        const belumDinilai = j?.belum_dinilai ?? false;
        return {
          id: s.id,
          nomor: s.nomor,
          tipe: s.tipe,
          teks: s.teks,
          gambar: s.gambar,
          pilihan: s.pilihan,
          pilihanSiswa: j?.pilihan ?? null,
          // Pedoman esai baru ditampilkan setelah dinilai guru agar tidak bocor saat mengerjakan ulang.
          kunci: s.tipe === 'esai' && belumDinilai ? '' : s.kunci,
          benar: j?.benar ?? false,
          belumDinilai,
        };
      }),
    };

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
