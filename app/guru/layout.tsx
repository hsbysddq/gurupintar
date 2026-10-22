import { KerangkaGuru } from '@/components/KerangkaGuru';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';

// Semua halaman guru bergantung pada cookie sesi, jadi selalu dirender dinamis.
export const dynamic = 'force-dynamic';

// Semua halaman guru hanya untuk akun berperan guru.
export default async function LayoutGuru({ children }: LayoutProps<'/guru'>) {
  const profil = await profilWajib('guru');
  const kelas = await ambilKelasGuru(ambilSupabase(), profil.id);
  return (
    <KerangkaGuru nama={profil.nama} kelas={kelas.map((k) => ({ id: k.id, nama: k.nama }))}>
      {children}
    </KerangkaGuru>
  );
}
