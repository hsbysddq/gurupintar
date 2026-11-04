import { KOIN_PER_MODUL } from '@/lib/konstanta';
import { wajibPeranApi } from '@/lib/server/auth';
import { bacaKoinGuru, PESAN_MIGRASI_KOIN } from '@/lib/server/koin';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, responsError, responsOk } from '@/lib/server/respons';
import type { KoinGuru } from '@/lib/tipe';

export const dynamic = 'force-dynamic';

// GET /api/guru/koin: saldo koin guru yang sedang login.
export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  try {
    const koin = await bacaKoinGuru(ambilSupabase(), auth.profil.id);
    if (koin === null) return responsError(PESAN_MIGRASI_KOIN, 503);

    const respons: KoinGuru = {
      koin,
      biayaModul: KOIN_PER_MODUL,
      whatsappAdmin:
        process.env.WHATSAPP_ADMIN?.trim() || process.env.NEXT_PUBLIC_WHATSAPP_ADMIN?.trim() || null,
    };
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
