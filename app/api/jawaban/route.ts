import { tentukanKelompok } from '@/lib/pengelompokan';
import { skemaBodyJawaban } from '@/lib/skema-api';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_DITUTUP,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/jawaban (PRD F-3, architecture.md 7.1)
// Kunci hanya dibaca di server; respons hanya { ok: true } tanpa skor atau kelompok (D-2, AC-3.6).
export async function POST(request: Request) {
  const input = skemaBodyJawaban.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, siswaId, jawaban } = input.data;

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

    const [soal, siswa] = await Promise.all([
      db.from('soal').select('id, kunci').eq('topik_id', sesi.topik_id),
      db.from('siswa').select('id').eq('id', siswaId).eq('kelas_id', sesi.kelas_id).maybeSingle(),
    ]);
    if (soal.error) return petakanErrorDb(soal.error);
    if (siswa.error) return petakanErrorDb(siswa.error);

    // 1. Jumlah jawaban = jumlah soal, soalId unik dan milik topik sesi.
    const kunci = new Map<string, string>(soal.data.map((s) => [s.id, s.kunci]));
    const soalDijawab = new Set(jawaban.map((j) => j.soalId));
    const lengkap =
      jawaban.length === kunci.size &&
      soalDijawab.size === jawaban.length &&
      [...soalDijawab].every((id) => kunci.has(id));
    if (!lengkap) return responsError('Jawaban belum lengkap. Jawab semua soal, lalu kirim lagi.', 400);

    // 2. Siswa harus anggota kelas sesi.
    if (!siswa.data) return responsError('Namamu tidak terdaftar di kelas ini.', 403);

    // 3–4. Nilai dihitung di server.
    const dinilai = jawaban.map((j) => ({ ...j, benar: kunci.get(j.soalId) === j.pilihan }));
    const skor = dinilai.filter((j) => j.benar).length;
    const total = kunci.size;

    // 5. Simpan atomik; kiriman ulang menimpa kiriman sebelumnya (AC-3.8).
    const simpan = await db.rpc('simpan_hasil', {
      p_sesi: sesiId,
      p_siswa: siswaId,
      p_jawaban: dinilai,
      p_skor: skor,
      p_total: total,
      p_kelompok: tentukanKelompok(skor, total),
    });
    if (simpan.error) return petakanErrorDb(simpan.error);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
