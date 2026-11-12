import { skemaBodySekolahBaru } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi } from '@/lib/server/auth';
import { buatAdminSekolah, buatSekolah, daftarSekolah } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  petakanErrorDb,
  responsError,
  responsOk,
} from '@/lib/server/respons';

export async function GET() {
  const auth = await wajibPeranApi('super_admin');
  if (!auth.ok) return auth.respons;
  try {
    return responsOk(await daftarSekolah(ambilSupabase()));
  } catch (err) {
    return petakanErrorDb(err);
  }
}

export async function POST(request: Request) {
  const auth = await wajibPeranApi('super_admin');
  if (!auth.ok) return auth.respons;

  const input = skemaBodySekolahBaru.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  const db = ambilSupabase();
  try {
    const sekolah = await buatSekolah(db, {
      nama: input.data.nama,
      alamat: input.data.alamat,
      kode: input.data.kode,
    });
    try {
      await buatAdminSekolah(sekolah.id, input.data.namaAdmin, input.data.emailAdmin, input.data.sandiAdmin);
    } catch (err) {
      await db.from('sekolah').delete().eq('id', sekolah.id);
      throw err;
    }
    return responsOk(sekolah, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Buat sekolah gagal:', err instanceof Error ? err.message : err);
    return petakanErrorDb(err);
  }
}
