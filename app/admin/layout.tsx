import { KerangkaAdmin } from '@/components/KerangkaAdmin';
import { profilWajib } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const profil = await profilWajib('admin_sekolah');
  return <KerangkaAdmin nama={profil.nama}>{children}</KerangkaAdmin>;
}
