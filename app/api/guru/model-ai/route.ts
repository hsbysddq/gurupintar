import { ambilDaftarModelAi, MODEL_DEFAULT } from '@/lib/server/ai-provider';
import { wajibPeranApi } from '@/lib/server/auth';
import { responsError, responsOk } from '@/lib/server/respons';
import type { DaftarModelAi } from '@/lib/tipe';

const PESAN_MODEL_BELUM_DIATUR =
  'Layanan AI belum siap. Coba lagi beberapa saat atau hubungi admin.';

export const dynamic = 'force-dynamic';

// GET /api/guru/model-ai: katalog model Command Code yang bisa dipilih guru.
export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const daftar = await ambilDaftarModelAi();
  if (daftar.length === 0) {
    console.error('Model AI kosong: COMMAND_CODE_API_KEY/ANTHROPIC_MODEL tidak terbaca oleh proses server.');
    return responsError(PESAN_MODEL_BELUM_DIATUR, 503);
  }

  const respons: DaftarModelAi = {
    modelDefault: daftar.some((m) => m.id === MODEL_DEFAULT) ? MODEL_DEFAULT : (daftar[0]?.id ?? ''),
    daftar,
  };
  return responsOk(respons);
}
