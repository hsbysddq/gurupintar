import { skemaBodyFormat } from '@/lib/skema-api';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/siswa/format (PRD F-2)
export async function POST(request: Request) {
  const input = skemaBodyFormat.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const { data, error } = await ambilSupabase()
      .from('siswa')
      .update({ preferensi_format: input.data.format })
      .eq('id', input.data.siswaId)
      .select('id');
    if (error) return petakanErrorDb(error);
    if (data.length === 0) return responsError('Nama siswa tidak ditemukan. Masukkan kode kelas lagi.', 404);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
