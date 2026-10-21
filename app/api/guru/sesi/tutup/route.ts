import { skemaBodyTutupSesi } from '@/lib/skema-api';
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

// POST /api/guru/sesi/tutup (PRD AC-4.5): hanya guru pemilik kelas sesi yang boleh menutup.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyTutupSesi.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const sesi = await sesiMilikGuru(db, auth.profil.id, input.data.sesiId);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const { data, error } = await db
      .from('sesi_kuis')
      .update({ status: 'selesai' })
      .eq('id', sesi.id)
      .select('id');
    if (error) return petakanErrorDb(error);
    if (data.length === 0) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
