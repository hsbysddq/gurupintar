import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TabKelas } from '@/components/TabKelas';
import type { KelasRingkas } from '@/lib/tipe';

/** Header bersama untuk semua halaman di dalam satu kelas. */
export function KepalaKelas({ kelas }: { kelas: KelasRingkas }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/guru"
          className="inline-flex min-h-10 items-center gap-1.5 text-[13px] leading-normal font-semibold text-tinta-lembut hover:text-primer"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Semua kelas
        </Link>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">{kelas.nama}</h1>
        <p className="text-tinta-lembut">
          {kelas.mapel} · {kelas.jumlahSiswa} siswa · Kode undangan {kelas.kodeUndangan}
        </p>
      </header>

      <Suspense fallback={null}>
        <TabKelas kelasId={kelas.id} />
      </Suspense>
    </div>
  );
}
