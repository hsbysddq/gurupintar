'use client';

import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-10">
      <KartuKaca as="section" className="flex flex-col gap-4 p-6">
        <h1 className="text-[28px] leading-tight font-bold">Terjadi kesalahan</h1>
        <p className="text-tinta-lembut">
          Halaman ini belum bisa ditampilkan. Coba muat ulang, atau kembali ke beranda.
        </p>
        <div className="flex flex-wrap gap-2">
          <Tombol varian="utama" onClick={reset}>
            Coba lagi
          </Tombol>
          <Tombol varian="sekunder" href="/">
            Ke beranda
          </Tombol>
        </div>
      </KartuKaca>
    </div>
  );
}
