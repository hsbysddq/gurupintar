import { skemaBodyBukaBlokirUjian } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi, wajibSekolah } from '@/lib/server/auth';
import { bukaBlokirUjian } from '@/lib/server/ujian';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

export async function POST(request: Request) {
  const auth = await wajibPeranApi('admin_sekolah');
  if (!auth.ok) return auth.respons;
  const input = skemaBodyBukaBlokirUjian.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    await bukaBlokirUjian(auth.profil.id, wajibSekolah(auth.profil), input.data.ujianId, input.data.siswaId);
    return responsOk({ ok: true });
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Buka blokir ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
