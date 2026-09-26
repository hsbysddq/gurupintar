import { skemaBodyTutupSesi } from '@/lib/skema-api';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/guru/sesi/tutup (PRD AC-4.5): kuis tidak lagi menerima jawaban.
// simpan_hasil mengunci baris sesi, jadi kiriman yang bersamaan dengan penutupan batal utuh (architecture.md 7.4).
export async function POST(request: Request) {
  const input = skemaBodyTutupSesi.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const { data, error } = await ambilSupabase()
      .from('sesi_kuis')
      .update({ status: 'selesai' })
      .eq('id', input.data.sesiId)
      .select('id');
    if (error) return petakanErrorDb(error);
    if (data.length === 0) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
