import { redirect } from 'next/navigation';
import { FormPengaturanKelas } from '@/components/FormPengaturanKelas';
import { KepalaKelas } from '@/components/KepalaKelas';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';

// Tab Pengaturan: ubah identitas kelas, salin kode undangan, atau arsipkan kelas.
export default async function HalamanPengaturanKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const profil = await profilWajib('guru');
  const daftar = await ambilKelasGuru(ambilSupabase(), profil.id);
  if (daftar.length === 0) redirect('/guru');

  const dipilih = daftar.find((k) => k.id === kelas);
  if (!dipilih) redirect(`/guru/kelas/pengaturan?kelas=${daftar[0].id}`);

  return (
    <div className="flex flex-col gap-6">
      <KepalaKelas kelas={dipilih} />
      <FormPengaturanKelas kelas={dipilih} />
    </div>
  );
}
