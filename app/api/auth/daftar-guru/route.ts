import { responsError } from '@/lib/server/respons';

// Pendaftaran publik ditutup untuk model multi-sekolah.
export async function POST() {
  return responsError('Pendaftaran ditutup. Hubungi admin sekolah untuk membuat akun.', 410);
}
