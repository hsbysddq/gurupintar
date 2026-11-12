import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib, wajibSekolah } from '@/lib/server/auth';
import { daftarGuruSekolah } from '@/lib/server/akun';
import { ambilSupabase } from '@/lib/server/supabase';
import { FormGuru } from '../FormGuru';

export default async function HalamanGuruSekolah() {
  const profil = await profilWajib('admin_sekolah');
  const sekolahId = wajibSekolah(profil);
  const guru = await daftarGuruSekolah(ambilSupabase(), sekolahId);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">Guru</h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">Buat akun guru untuk sekolah ini.</p>
      </header>
      <KartuKaca className="p-5 sm:p-6">
        <h2 className="mb-4 font-display text-[18px] font-bold text-aura-ink">Akun guru baru</h2>
        <FormGuru />
      </KartuKaca>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-bold text-aura-ink">Daftar guru ({guru.length})</h2>
        <KartuKaca className="divide-y divide-white/60 p-2">
          {guru.length === 0 ? <p className="p-4 text-[14px] text-aura-muted">Belum ada guru.</p> : guru.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
              <p className="font-display text-[14px] font-semibold text-aura-ink">{g.nama}</p>
              <p className="font-body text-[12px] text-aura-muted">{g.email}</p>
            </div>
          ))}
        </KartuKaca>
      </section>
    </div>
  );
}
