import { notFound, redirect } from 'next/navigation';
import { DetailMapelSiswa } from '@/components/DetailMapelSiswa';
import { KerangkaDasborSiswa } from '@/components/KerangkaDasborSiswa';
import { PerbaruiOtomatis } from '@/components/PerbaruiOtomatis';
import { pilihTab, susunDetailMapel } from '@/lib/detail-mapel';
import { INTERVAL_POLLING_SISWA_MS } from '@/lib/konstanta';
import { profilWajib } from '@/lib/server/auth';
import { ambilDataDetailMapel } from '@/lib/server/detail-mapel';
import { ambilSupabase } from '@/lib/server/supabase';
import { skemaQueryKelasSiswa } from '@/lib/skema-api';

// Detail satu mata pelajaran: materi kelas, kuis, dan histori hasil kuis. Data dibaca di server untuk siswa
// yang login (bukan anggota kelas → 404) dan diperbarui otomatis agar kuis aktif langsung muncul.
export default async function HalamanDetailMapel({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; tab?: string }>;
}) {
  const { kelas, tab } = await searchParams;
  const id = skemaQueryKelasSiswa.safeParse({ kelas });
  if (!id.success) redirect('/siswa/kelas');

  const profil = await profilWajib('siswa');
  const hasil = await ambilDataDetailMapel(ambilSupabase(), profil.id, id.data.kelas);
  if (!hasil) notFound();

  return (
    <KerangkaDasborSiswa>
      <DetailMapelSiswa kelas={hasil.data.kelas} detail={susunDetailMapel(hasil.data)} tabAwal={pilihTab(tab)} />
      <PerbaruiOtomatis intervalMs={INTERVAL_POLLING_SISWA_MS} />
    </KerangkaDasborSiswa>
  );
}
