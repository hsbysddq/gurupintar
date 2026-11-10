import { skemaBodyLupaSandi } from '@/lib/skema-api';
import { kirimKodeResetSandi } from '@/lib/server/auth';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/auth/lupa-sandi. Respons selalu sama agar status email tidak bocor.
export async function POST(request: Request) {
  const input = skemaBodyLupaSandi.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const asal = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin).replace(/\/$/, '');
    await kirimKodeResetSandi(input.data.email, `${asal}/masuk`);
  } catch (err) {
    console.error('Permintaan reset sandi gagal:', err instanceof Error ? err.message : err);
  }

  return responsOk({ ok: true });
}
