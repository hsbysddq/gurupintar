import { DaftarMapelSiswa } from '@/components/DaftarMapelSiswa';
import { KerangkaDasborSiswa } from '@/components/KerangkaDasborSiswa';
import { PerbaruiOtomatis } from '@/components/PerbaruiOtomatis';
import { hitungBeranda } from '@/lib/beranda-siswa';
import { INTERVAL_POLLING_SISWA_MS } from '@/lib/konstanta';
import { profilWajib } from '@/lib/server/auth';
import { ambilDataBerandaSiswa } from '@/lib/server/beranda-siswa';
import { ambilSupabase } from '@/lib/server/supabase';

// Mata Pelajaran: kelas yang diikuti siswa. Data dibaca di server dan diperbarui otomatis
// supaya kuis yang baru dibuka guru langsung muncul.
export default async function HalamanMataPelajaran() {
  const profil = await profilWajib('siswa');
  const data = await ambilDataBerandaSiswa(ambilSupabase(), profil.id);
  const ringkasan = hitungBeranda(data);

  return (
    <KerangkaDasborSiswa>
      <DaftarMapelSiswa kelas={ringkasan.kelas} />
      <PerbaruiOtomatis intervalMs={INTERVAL_POLLING_SISWA_MS} />
    </KerangkaDasborSiswa>
  );
}
