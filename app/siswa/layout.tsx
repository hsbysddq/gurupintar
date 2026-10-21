import { PenyediaSiswa } from '@/components/PenyediaSiswa';
import { profilWajib } from '@/lib/server/auth';

// Semua halaman siswa bergantung pada cookie sesi, jadi selalu dirender dinamis.
export const dynamic = 'force-dynamic';

// Semua halaman siswa hanya untuk akun berperan siswa. Redirect dilakukan di server.
export default async function LayoutSiswa({ children }: LayoutProps<'/siswa'>) {
  const profil = await profilWajib('siswa');
  return <PenyediaSiswa profil={profil}>{children}</PenyediaSiswa>;
}
