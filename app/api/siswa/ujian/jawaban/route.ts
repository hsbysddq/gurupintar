import { skemaBodyJawabanUjian } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi } from '@/lib/server/auth';
import { simpanJawabanUjian } from '@/lib/server/ujian';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

export async function PUT(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;
  const input = skemaBodyJawabanUjian.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    await simpanJawabanUjian(auth.profil.id, input.data.ujianId, input.data.soalId, input.data.jawaban);
    return responsOk({ ok: true });
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Simpan jawaban ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
