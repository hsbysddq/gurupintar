import type { NextRequest } from 'next/server';
import { skemaQueryKelasOpsional } from '@/lib/skema-api';
import { idKelasMilikGuru, kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { dataPendampinganKelas } from '@/lib/server/pendampingan-kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { DataPendampingan } from '@/lib/tipe';

const PESAN_KELAS_TIDAK_ADA = 'Kelas tidak ditemukan.';

// GET /api/guru/pendampingan?kelas= (PRD F-8, architecture.md 8.4). Hanya guru pemilik kelas.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryKelasOpsional.safeParse({
    kelas: request.nextUrl.searchParams.get('kelas') ?? undefined,
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    let kelasId = input.data.kelas;
    if (kelasId) {
      if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
        return responsError(PESAN_KELAS_TIDAK_ADA, 404);
      }
    } else {
      const ids = await idKelasMilikGuru(db, auth.profil.id);
      if (ids.length === 0) return responsOk<DataPendampingan>({ perluPendampingan: [], kemajuan: [] });
      kelasId = ids[0];
    }

    return responsOk(await dataPendampinganKelas(db, kelasId));
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
