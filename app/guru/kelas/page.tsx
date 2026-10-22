import { redirect } from 'next/navigation';
import { KepalaKelas } from '@/components/KepalaKelas';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { RuangKelas } from './RuangKelas';

// Ruang kerja satu kelas. Kelas dipilih lewat ?kelas= dan harus milik guru yang login.
export default async function HalamanRuangKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const profil = await profilWajib('guru');
  const daftar = await ambilKelasGuru(ambilSupabase(), profil.id);
  if (daftar.length === 0) redirect('/guru');

  const dipilih = daftar.find((k) => k.id === kelas);
  if (!dipilih) redirect(`/guru/kelas?kelas=${daftar[0].id}`);

  return (
    <div className="flex flex-col gap-6">
      <KepalaKelas kelas={dipilih} />
      <RuangKelas kelas={dipilih} />
    </div>
  );
}
