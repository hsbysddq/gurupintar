import { PESAN_KREDENSIAL_SALAH } from '@/lib/auth';
import { skemaBodyMasuk } from '@/lib/skema-api';
import { GalatAuth, masukDenganSandi } from '@/lib/server/auth';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

// POST /api/auth/masuk. Peran tidak pernah dikirim dari browser; server membacanya dari profil.
export async function POST(request: Request) {
  const input = skemaBodyMasuk.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const profil = await masukDenganSandi(input.data.email, input.data.password);
    if (!profil) return responsError(PESAN_KREDENSIAL_SALAH, 401);
    return responsOk({ peran: profil.peran });
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Login gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
