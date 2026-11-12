import { skemaBodyAkunGuru } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi, wajibSekolah } from '@/lib/server/auth';
import { buatGuruSekolah, daftarGuruSekolah } from '@/lib/server/akun';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  petakanErrorDb,
  responsError,
  responsOk,
} from '@/lib/server/respons';

export async function GET() {
  const auth = await wajibPeranApi('admin_sekolah');
  if (!auth.ok) return auth.respons;
  try {
    const sekolahId = wajibSekolah(auth.profil);
    return responsOk(await daftarGuruSekolah(ambilSupabase(), sekolahId));
  } catch (err) {
    return petakanErrorDb(err);
  }
}

export async function POST(request: Request) {
  const auth = await wajibPeranApi('admin_sekolah');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyAkunGuru.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const id = await buatGuruSekolah(
      wajibSekolah(auth.profil),
      input.data.nama,
      input.data.email,
      input.data.password,
    );
    return responsOk({ id }, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Buat akun guru gagal:', err instanceof Error ? err.message : err);
    return petakanErrorDb(err);
  }
}
