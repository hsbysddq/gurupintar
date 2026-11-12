import { skemaBodyPelanggaranUjian } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi } from '@/lib/server/auth';
import { catatPelanggaranUjian } from '@/lib/server/ujian';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;
  const input = skemaBodyPelanggaranUjian.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    return responsOk(await catatPelanggaranUjian(auth.profil.id, input.data.ujianId, input.data.jenis));
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Pelanggaran ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
