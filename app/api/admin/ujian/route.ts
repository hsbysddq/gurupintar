import type { NextRequest } from 'next/server';
import { skemaQueryUjian } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi, wajibSekolah } from '@/lib/server/auth';
import { daftarUjianAdmin, detailUjianAdmin } from '@/lib/server/ujian';
import { PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('admin_sekolah');
  if (!auth.ok) return auth.respons;
  const id = request.nextUrl.searchParams.get('ujian');

  try {
    const sekolahId = wajibSekolah(auth.profil);
    if (id) {
      const input = skemaQueryUjian.safeParse({ ujian: id });
      if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
      return responsOk(await detailUjianAdmin(sekolahId, input.data.ujian));
    }
    return responsOk(await daftarUjianAdmin(sekolahId));
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Daftar ujian admin gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
