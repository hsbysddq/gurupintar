import { KerangkaSuperAdmin } from '@/components/KerangkaSuperAdmin';
import { profilWajib } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function LayoutSuperAdmin({ children }: { children: React.ReactNode }) {
  const profil = await profilWajib('super_admin');
  return <KerangkaSuperAdmin nama={profil.nama}>{children}</KerangkaSuperAdmin>;
}
