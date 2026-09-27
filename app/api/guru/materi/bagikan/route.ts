import { skemaBodyBagikanMateri } from '@/lib/skema-api';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/guru/materi/bagikan (PRD AC-6.9): semua materi draf di sesi menjadi dibagikan.
export async function POST(request: Request) {
  const input = skemaBodyBagikanMateri.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId } = input.data;

  try {
    const db = ambilSupabase();
    const sesi = await db.from('sesi_kuis').select('id').eq('id', sesiId).maybeSingle();
    if (sesi.error) return petakanErrorDb(sesi.error);
    if (!sesi.data) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const { data, error } = await db
      .from('materi')
      .update({ status: 'dibagikan' })
      .eq('sesi_id', sesiId)
      .eq('status', 'draf')
      .select('id');
    if (error) return petakanErrorDb(error);

    return responsOk({ ok: true, jumlahDibagikan: data.length });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
