import { skemaBodyBagikanMateri } from '@/lib/skema-api';
import { sesiMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/guru/materi/bagikan (PRD AC-6.9): hanya guru pemilik sesi.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyBagikanMateri.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId } = input.data;

  try {
    const db = ambilSupabase();
    const sesi = await sesiMilikGuru(db, auth.profil.id, sesiId);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const { data, error } = await db
      .from('materi')
      .update({ status: 'dibagikan' })
      .eq('sesi_id', sesi.id)
      .eq('status', 'draf')
      .select('id');
    if (error) return petakanErrorDb(error);

    return responsOk({ ok: true, jumlahDibagikan: data.length });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
