import type { NextRequest } from 'next/server';
import { skemaQueryUjian } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi } from '@/lib/server/auth';
import { hasilUjianSiswa } from '@/lib/server/ujian';
import { PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;
  const input = skemaQueryUjian.safeParse({ ujian: request.nextUrl.searchParams.get('ujian') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    return responsOk(await hasilUjianSiswa(auth.profil.id, input.data.ujian));
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Hasil ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
