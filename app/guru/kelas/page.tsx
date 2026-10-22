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
    <div className="relative isolate -mx-4 -my-6 flex flex-col gap-6 overflow-x-clip bg-aura-canvas px-4 py-6 md:-m-8 md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-aura-primary/10 blur-[100px]" />
        <div className="absolute -right-20 top-40 size-72 rounded-full bg-aura-violet/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-[#FB923C]/10 blur-[100px]" />
      </div>
      <KepalaKelas kelas={dipilih} />
      <RuangKelas kelas={dipilih} />
    </div>
  );
}
