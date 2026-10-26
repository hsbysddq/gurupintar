import { redirect } from 'next/navigation';
import { BerandaSiswa } from '@/components/BerandaSiswa';
import { KerangkaDasborSiswa } from '@/components/KerangkaDasborSiswa';
import { hitungBeranda } from '@/lib/beranda-siswa';
import { profilWajib } from '@/lib/server/auth';
import { ambilDataBerandaSiswa } from '@/lib/server/beranda-siswa';
import { ambilSupabase } from '@/lib/server/supabase';

// Beranda siswa setelah masuk. Semua angka dihitung dari data siswa yang login.
export default async function HalamanBerandaSiswa({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string; kelas?: string }>;
}) {
  const { kode, kelas } = await searchParams;
  // Tautan dan QR lama berbentuk /siswa?kode=XXXXX; arahkan ke halaman gabung.
  if (kode) redirect(`/siswa/gabung?kode=${encodeURIComponent(kode)}`);

  const profil = await profilWajib('siswa');
  const data = await ambilDataBerandaSiswa(ambilSupabase(), profil.id);
  const ringkasan = hitungBeranda(data, kelas);

  return (
    <KerangkaDasborSiswa>
      <BerandaSiswa nama={profil.nama} ringkasan={ringkasan} />
    </KerangkaDasborSiswa>
  );
}
