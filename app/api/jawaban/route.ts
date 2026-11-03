import { tentukanKelompok } from '@/lib/pengelompokan';
import { skemaBodyJawaban } from '@/lib/skema-api';
import { periksaDanNilaiJawaban } from '@/lib/soal-tka';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { bacaBlokir } from '@/lib/server/blokir';
import { bacaSoalTopik, perluMigrasiSoalTka, PESAN_MIGRASI_SOAL_TKA } from '@/lib/server/soal-tka-db';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_DIBLOKIR,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_DITUTUP,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/jawaban (PRD F-3, architecture.md 7.1)
// `siswaId` diambil dari sesi login, tidak pernah dari body. Kunci hanya dibaca di server;
// respons berisi { ok, skor, total, menungguNilai } tanpa kelompok (D-2).
export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyJawaban.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, jawaban } = input.data;
  const siswaId = auth.profil.id;

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('kelas_id, topik_id, status')
      .eq('id', sesiId)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);
    if (sesi.status !== 'aktif') return responsError(PESAN_SESI_DITUTUP, 409);

    if (!(await anggotaKelas(db, siswaId, sesi.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    if ((await bacaBlokir(db, sesiId, siswaId))?.terblokir) return responsError(PESAN_DIBLOKIR, 423);

    const muatanSoal = await bacaSoalTopik(db, sesi.topik_id, { sertakanRahasia: true });
    if (muatanSoal.error || !muatanSoal.data) return petakanErrorDb(muatanSoal.error);
    const petaSoal = new Map(muatanSoal.data.map((s) => [s.id, s]));

    // 1. Jumlah jawaban = jumlah soal, soalId unik dan milik topik sesi.
    const soalDijawab = new Set(jawaban.map((j) => j.soalId));
    const lengkap =
      jawaban.length === petaSoal.size &&
      soalDijawab.size === jawaban.length &&
      [...soalDijawab].every((id) => petaSoal.has(id));
    if (!lengkap) return responsError('Jawaban belum lengkap. Jawab semua soal, lalu kirim lagi.', 400);

    // 2–3. Format tiap jawaban diperiksa sesuai tipe soal dan dinilai di server.
    const dinilai: { soalId: string; pilihan: string; benar: boolean; belumDinilai: boolean }[] = [];
    for (const j of jawaban) {
      const soal = petaSoal.get(j.soalId)!;
      const hasil = periksaDanNilaiJawaban(soal, j.pilihan);
      if (!hasil.valid) {
        return responsError('Format jawaban belum sesuai. Periksa kembali semua soal, lalu kirim lagi.', 400);
      }
      dinilai.push({
        soalId: j.soalId,
        pilihan: hasil.pilihanKanoni,
        benar: hasil.benar,
        belumDinilai: hasil.belumDinilai,
      });
    }

    const skor = dinilai.filter((j) => j.benar).length;
    const total = petaSoal.size;
    const menungguNilai = dinilai.filter((j) => j.belumDinilai).length;

    // 4. Simpan atomik; kiriman ulang menimpa kiriman sebelumnya (AC-3.8).
    const simpan = await db.rpc('simpan_hasil', {
      p_sesi: sesiId,
      p_siswa: siswaId,
      p_jawaban: dinilai,
      p_skor: skor,
      p_total: total,
      p_kelompok: tentukanKelompok(skor, total),
    });
    if (simpan.error) {
      if (perluMigrasiSoalTka(simpan.error)) {
        return responsError(PESAN_MIGRASI_SOAL_TKA, 503);
      }
      return petakanErrorDb(simpan.error);
    }

    return responsOk({ ok: true, skor, total, menungguNilai });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
