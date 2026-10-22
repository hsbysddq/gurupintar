import { redirect } from 'next/navigation';
import { DaftarSiswaKelas } from '@/components/DaftarSiswaKelas';
import { KepalaKelas } from '@/components/KepalaKelas';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru, ambilSiswaKelas } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';

// Tab Siswa: anggota kelas beserta format belajar dan hasil terbarunya.
export default async function HalamanSiswaKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const profil = await profilWajib('guru');
  const db = ambilSupabase();
  const daftar = await ambilKelasGuru(db, profil.id);
  if (daftar.length === 0) redirect('/guru');

  const dipilih = daftar.find((k) => k.id === kelas);
  if (!dipilih) redirect(`/guru/kelas/siswa?kelas=${daftar[0].id}`);

  const siswa = await ambilSiswaKelas(db, profil.id, dipilih.id);
  if (!siswa) redirect('/guru');

  return (
    <div className="flex flex-col gap-6">
      <KepalaKelas kelas={dipilih} />
      <DaftarSiswaKelas siswa={siswa} kodeUndangan={dipilih.kodeUndangan} />
    </div>
  );
}
