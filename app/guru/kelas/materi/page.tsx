import { redirect } from 'next/navigation';
import { DaftarMateriKelas } from '@/components/DaftarMateriKelas';
import { KepalaKelas } from '@/components/KepalaKelas';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru, ambilMateriKelas } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';

// Tab Materi: semua sesi kuis kelas ini beserta status materinya.
export default async function HalamanMateriKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const profil = await profilWajib('guru');
  const db = ambilSupabase();
  const daftarKelas = await ambilKelasGuru(db, profil.id);
  if (daftarKelas.length === 0) redirect('/guru');

  const dipilih = daftarKelas.find((k) => k.id === kelas);
  if (!dipilih) redirect(`/guru/kelas/materi?kelas=${daftarKelas[0].id}`);

  const materi = await ambilMateriKelas(db, profil.id, dipilih.id);
  if (!materi) redirect('/guru');

  return (
    <div className="flex flex-col gap-6">
      <KepalaKelas kelas={dipilih} />
      <DaftarMateriKelas kelas={dipilih} daftar={materi} />
    </div>
  );
}
