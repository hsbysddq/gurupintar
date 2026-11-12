import { daftarUjianSiswa } from '@/lib/server/ujian';
import { wajibPeranApi } from '@/lib/server/auth';
import { PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';

export async function GET() {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;
  try {
    return responsOk(await daftarUjianSiswa(auth.profil.id));
  } catch (err) {
    console.error('Daftar ujian siswa gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
