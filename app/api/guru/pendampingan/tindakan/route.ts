import { skemaBodyTindakanPendampingan } from '@/lib/skema-api';
import { kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { dataPendampinganKelas } from '@/lib/server/pendampingan-kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  petakanErrorDb,
  responsError,
  responsOk,
  tabelBelumAda,
} from '@/lib/server/respons';

const PESAN_KELAS_TIDAK_ADA = 'Kelas tidak ditemukan.';
const PESAN_SISWA_TIDAK_ADA = 'Siswa tidak ditemukan di kelas ini.';
const PESAN_TIDAK_PERLU = 'Siswa ini tidak memerlukan tindakan pendampingan.';
const PESAN_EVALUASI = 'Evaluasi tanpa pendampingan hanya untuk siswa setengah paham.';
const PESAN_SELESAI = 'Pendampingan belum dimulai untuk siswa ini.';
const PESAN_MIGRASI =
  'Fitur tindakan pendampingan belum aktif. Jalankan supabase/migrasi-tindakan-pendampingan.sql di Supabase SQL Editor.';

// POST /api/guru/pendampingan/tindakan: keputusan guru dan status pendampingan.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyTindakanPendampingan.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  const { kelasId, siswaId, tindakan } = input.data;

  try {
    const db = ambilSupabase();
    if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
      return responsError(PESAN_KELAS_TIDAK_ADA, 404);
    }

    const anggota = await db
      .from('keanggotaan_kelas')
      .select('siswa_id')
      .eq('kelas_id', kelasId)
      .eq('siswa_id', siswaId)
      .maybeSingle();
    if (anggota.error) return petakanErrorDb(anggota.error);
    if (!anggota.data) return responsError(PESAN_SISWA_TIDAK_ADA, 404);

    const data = await dataPendampinganKelas(db, kelasId);
    if (data.ringkasan.perluMigrasi) return responsError(PESAN_MIGRASI, 503);

    const siswa = data.siswa.find((s) => s.siswaId === siswaId);
    if (!siswa || siswa.kategori === 'paham' || siswa.kategori === 'belum-cukup') {
      return responsError(PESAN_TIDAK_PERLU, 409);
    }
    if (tindakan === 'evaluasi' && siswa.kategori !== 'setengah') {
      return responsError(PESAN_EVALUASI, 409);
    }
    if (tindakan === 'selesai' && siswa.status !== 'pendampingan') {
      return responsError(PESAN_SELESAI, 409);
    }
    if (tindakan === 'pendampingan' && siswa.status !== 'menunggu' && siswa.status !== 'pendampingan') {
      return responsError(PESAN_TIDAK_PERLU, 409);
    }
    if (!siswa.sesiTerakhirId) return responsError(PESAN_TIDAK_PERLU, 409);

    const { error } = await db.from('tindakan_pendampingan').upsert(
      {
        kelas_id: kelasId,
        siswa_id: siswaId,
        sesi_terakhir_id: siswa.sesiTerakhirId,
        kategori: siswa.kategori,
        tindakan,
        diperbarui_pada: new Date().toISOString(),
      },
      { onConflict: 'kelas_id,siswa_id' },
    );
    if (error) {
      if (tabelBelumAda(error)) return responsError(PESAN_MIGRASI, 503);
      return petakanErrorDb(error);
    }

    return responsOk({ ok: true });
  } catch (err) {
    console.error('Tindakan pendampingan:', err);
    return petakanErrorDb(err);
  }
}
