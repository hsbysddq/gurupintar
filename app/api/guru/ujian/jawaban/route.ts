import { skemaBodyNilaiEsaiUjian } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi, wajibSekolah } from '@/lib/server/auth';
import { nilaiEsaiUjian } from '@/lib/server/ujian';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

export async function PATCH(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;
  const input = skemaBodyNilaiEsaiUjian.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    await nilaiEsaiUjian(
      auth.profil.id,
      wajibSekolah(auth.profil),
      input.data.ujianId,
      input.data.siswaId,
      input.data.soalId,
      input.data.benar,
    );
    return responsOk({ ok: true });
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Nilai esai ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
