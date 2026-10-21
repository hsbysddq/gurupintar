import { skemaBodyFormat } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/siswa/format (PRD F-2). Identitas siswa berasal dari sesi login.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyFormat.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, format } = input.data;

  try {
    const db = ambilSupabase();
    const sesi = await db.from('sesi_kuis').select('kelas_id').eq('id', sesiId).maybeSingle();
    if (sesi.error) return petakanErrorDb(sesi.error);
    if (!sesi.data) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    if (!(await anggotaKelas(db, auth.profil.id, sesi.data.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    const { data, error } = await db
      .from('keanggotaan_kelas')
      .update({ preferensi_format: format })
      .eq('kelas_id', sesi.data.kelas_id)
      .eq('siswa_id', auth.profil.id)
      .select('siswa_id');
    if (error) return petakanErrorDb(error);
    if (data.length === 0) return responsError('Keanggotaan kelas tidak ditemukan. Masukkan kode kelas lagi.', 404);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
