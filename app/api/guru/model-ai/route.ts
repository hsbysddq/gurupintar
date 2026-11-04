import { ambilDaftarModelAi, MODEL_DEFAULT } from '@/lib/server/ai-provider';
import { wajibPeranApi } from '@/lib/server/auth';
import { responsOk } from '@/lib/server/respons';
import type { DaftarModelAi } from '@/lib/tipe';

export const dynamic = 'force-dynamic';

// GET /api/guru/model-ai: katalog model Command Code yang bisa dipilih guru.
export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const daftar = await ambilDaftarModelAi();
  const respons: DaftarModelAi = {
    modelDefault: daftar.some((m) => m.id === MODEL_DEFAULT) ? MODEL_DEFAULT : (daftar[0]?.id ?? ''),
    daftar,
  };
  return responsOk(respons);
}
