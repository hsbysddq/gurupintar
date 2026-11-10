import { skemaBodyAturSandi } from '@/lib/skema-api';
import { aturUlangSandi, GalatAuth } from '@/lib/server/auth';
import {
  bacaBodyJson,
  PESAN_ERROR_UMUM,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/auth/atur-sandi: verifikasi OTP recovery lalu simpan sandi baru.
export async function POST(request: Request) {
  const input = skemaBodyAturSandi.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    await aturUlangSandi(input.data.email, input.data.token, input.data.password);
    return responsOk({ ok: true });
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Atur sandi gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
