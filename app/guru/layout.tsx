import { KerangkaGuru } from '@/components/KerangkaGuru';
import { profilWajib } from '@/lib/server/auth';

// Semua halaman guru bergantung pada cookie sesi, jadi selalu dirender dinamis.
export const dynamic = 'force-dynamic';

// Semua halaman guru hanya untuk akun berperan guru.
export default async function LayoutGuru({ children }: LayoutProps<'/guru'>) {
  const profil = await profilWajib('guru');
  return <KerangkaGuru nama={profil.nama}>{children}</KerangkaGuru>;
}
