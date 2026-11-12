import Link from 'next/link';
import { School } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { daftarSekolah } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';
import { FormSekolah } from './FormSekolah';

export default async function HalamanSuperAdmin() {
  const sekolah = await daftarSekolah(ambilSupabase());

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">Super-admin</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
          Sekolah
        </h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">
          Buat sekolah baru sekaligus admin pertamanya. Admin sekolah yang akan membuat akun guru dan siswa.
        </p>
      </header>

      <KartuKaca className="p-5 sm:p-6">
        <h2 className="mb-4 font-display text-[18px] font-bold text-aura-ink">Sekolah baru</h2>
        <FormSekolah />
      </KartuKaca>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[18px] font-bold text-aura-ink">Daftar sekolah</h2>
          <span className="font-body text-[12px] text-aura-muted">{sekolah.length} sekolah</span>
        </div>
        {sekolah.length === 0 ? (
          <KartuKaca className="p-5 text-[14px] text-aura-muted">Belum ada sekolah.</KartuKaca>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {sekolah.map((s) => (
              <li key={s.id}>
                <KartuKaca className="flex items-start gap-3 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                    <School aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-bold text-aura-ink">{s.nama}</p>
                    <p className="font-body text-[12px] leading-[18px] text-aura-muted">
                      Kode {s.kode}{s.alamat ? ` · ${s.alamat}` : ''}
                    </p>
                    <Link href={`/super-admin/admin?sekolah=${s.id}`} className="mt-1 inline-block text-[12px] font-semibold text-aura-primary hover:underline">
                      Tambah admin
                    </Link>
                  </div>
                </KartuKaca>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
