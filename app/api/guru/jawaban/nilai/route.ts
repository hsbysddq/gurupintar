import { tentukanKelompok } from '@/lib/pengelompokan';
import { skemaBodyNilaiEsai } from '@/lib/skema-api';
import { sesiMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import {
  bacaJawabanSesi,
  bacaSoalTopik,
  perluMigrasiSoalTka,
  PESAN_MIGRASI_SOAL_TKA,
  simpanNilaiEsai,
} from '@/lib/server/soal-tka-db';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/guru/jawaban/nilai: guru menilai jawaban esai siswa (Benar / Salah) secara manual,
// lalu server menghitung ulang skor dan kelompok pemahaman siswa pada sesi itu.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyNilaiEsai.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, siswaId, soalId, benar } = input.data;

  try {
    const db = ambilSupabase();
    const sesi = await sesiMilikGuru(db, auth.profil.id, sesiId);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const [muatanSoal, muatanJawaban] = await Promise.all([
      bacaSoalTopik(db, sesi.topik_id, { sertakanRahasia: true }),
      bacaJawabanSesi(db, sesiId, siswaId),
    ]);
    if (muatanSoal.error || !muatanSoal.data) return petakanErrorDb(muatanSoal.error);
    if (muatanJawaban.error || !muatanJawaban.data) return petakanErrorDb(muatanJawaban.error);

    const soalTarget = muatanSoal.data.find((s) => s.id === soalId);
    if (!soalTarget || soalTarget.tipe !== 'esai') {
      return responsError('Soal esai tidak ditemukan di kuis ini.', 404);
    }

    const jawabanTarget = muatanJawaban.data.find((j) => j.soal_id === soalId);
    if (!jawabanTarget) {
      return responsError('Jawaban siswa belum ditemukan.', 404);
    }

    const total = muatanSoal.data.length;
    const skor = muatanJawaban.data.reduce(
      (jum, j) => jum + ((j.soal_id === soalId ? benar : j.benar) ? 1 : 0),
      0,
    );
    const kelompok = tentukanKelompok(skor, total);

    const simpan = await simpanNilaiEsai(db, {
      sesiId,
      siswaId,
      soalId,
      benar,
      skor,
      total,
      kelompok,
    });
    if (simpan.error) {
      if (perluMigrasiSoalTka(simpan.error)) {
        return responsError(PESAN_MIGRASI_SOAL_TKA, 503);
      }
      return petakanErrorDb(simpan.error);
    }

    return responsOk({ ok: true, skor, total, kelompok });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

