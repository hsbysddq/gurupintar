import { skemaBodyAdminSekolah } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi } from '@/lib/server/auth';
import { buatAdminSekolah, sekolahAda } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  petakanErrorDb,
  responsError,
  responsOk,
} from '@/lib/server/respons';

export async function POST(request: Request) {
  const auth = await wajibPeranApi('super_admin');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyAdminSekolah.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    if (!(await sekolahAda(db, input.data.sekolahId))) {
      return responsError('Sekolah tidak ditemukan.', 404);
    }
    const id = await buatAdminSekolah(
      input.data.sekolahId,
      input.data.nama,
      input.data.email,
      input.data.password,
    );
    return responsOk({ id }, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Buat admin sekolah gagal:', err instanceof Error ? err.message : err);
    return petakanErrorDb(err);
  }
}
