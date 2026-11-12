import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib, wajibSekolah } from '@/lib/server/auth';
import { daftarSiswaSekolah } from '@/lib/server/akun';
import { daftarKelasSekolah } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';
import { FormSiswa } from '../FormSiswa';

export default async function HalamanSiswaSekolah() {
  const profil = await profilWajib('admin_sekolah');
  const sekolahId = wajibSekolah(profil);
  const db = ambilSupabase();
  const [siswa, kelas] = await Promise.all([
    daftarSiswaSekolah(db, sekolahId),
    daftarKelasSekolah(db, sekolahId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">Siswa</h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">Buat akun siswa dan masukkan ke kelas.</p>
      </header>
      <KartuKaca className="p-5 sm:p-6">
        <h2 className="mb-4 font-display text-[18px] font-bold text-aura-ink">Akun siswa baru</h2>
        <FormSiswa kelas={kelas} />
      </KartuKaca>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-bold text-aura-ink">Daftar siswa ({siswa.length})</h2>
        <KartuKaca className="divide-y divide-white/60 p-2">
          {siswa.length === 0 ? <p className="p-4 text-[14px] text-aura-muted">Belum ada siswa.</p> : siswa.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
              <div>
                <p className="font-display text-[14px] font-semibold text-aura-ink">{s.nama}</p>
                <p className="font-body text-[12px] text-aura-muted">{s.email}</p>
              </div>
              <p className="font-body text-[12px] text-aura-muted">{s.kelas?.length ? s.kelas.join(', ') : 'Belum masuk kelas'}</p>
            </div>
          ))}
        </KartuKaca>
      </section>
    </div>
  );
}
