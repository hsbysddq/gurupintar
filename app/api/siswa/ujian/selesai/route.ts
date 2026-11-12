import { z } from 'zod';
import { GalatAuth, wajibPeranApi } from '@/lib/server/auth';
import { selesaikanUjian } from '@/lib/server/ujian';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

const skema = z.object({ ujianId: z.uuid() });

export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;
  const input = skema.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    await selesaikanUjian(auth.profil.id, input.data.ujianId);
    return responsOk({ ok: true });
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Selesai ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
