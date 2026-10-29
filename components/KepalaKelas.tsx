import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, School, Users } from 'lucide-react';
import { TabKelas } from '@/components/TabKelas';
import type { KelasRingkas } from '@/lib/tipe';

/** Header bersama untuk semua halaman di dalam satu kelas. */
export function KepalaKelas({ kelas }: { kelas: KelasRingkas }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/guru"
          className="aura-glass-subtle inline-flex min-h-12 items-center gap-2 rounded-full px-3.5 font-display text-[12px] font-semibold text-aura-muted transition-colors hover:bg-white/70 hover:text-aura-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Semua kelas
        </Link>
      </div>

      <header className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="aura-eyebrow">Ruang kelas</span>
            <h1 className="mt-3 break-words font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
              {kelas.mapel}
            </h1>
            <p className="mt-1 flex items-center gap-2 font-body text-[15px] leading-[24px] text-aura-muted">
              <School aria-hidden="true" className="size-4 shrink-0 text-aura-primary" />
              {kelas.nama}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
              <Users aria-hidden="true" className="size-3.5 text-aura-primary" />
              {kelas.jumlahSiswa} siswa
            </span>
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
              <KeyRound aria-hidden="true" className="size-3.5 text-aura-indigo" />
              {kelas.kodeUndangan}
            </span>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <TabKelas kelasId={kelas.id} />
      </Suspense>
    </div>
  );
}
