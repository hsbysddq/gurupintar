import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { TulisanGuruPintar } from "@/components/LogoGuruPintar";

type KerangkaSiswaProps = {
  children: ReactNode;
  /** Tombol aksi utama; menempel di bawah layar di HP, panel samping di desktop. */
  aksi?: ReactNode;
};

/**
 * Kerangka alur siswa (gabung, pilih format, kuis, materi, selesai).
 * Di HP tetap satu kolom sempit; di desktop memakai konten + panel aksi agar tidak terasa seperti aplikasi mobile.
 */
export function KerangkaSiswa({ children, aksi }: KerangkaSiswaProps) {
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-4 text-base leading-relaxed md:max-w-[1120px] md:px-6">
      <header className="flex items-center justify-between gap-4 py-4 md:py-6">
        <Link href="/siswa" aria-label="Guru Pintarku, ke dasbor siswa" className="inline-flex min-h-11 items-center">
          <TulisanGuruPintar className="h-5 w-auto sm:h-6" />
        </Link>
        <Link
          href="/siswa"
          className="aura-glass-subtle inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-display text-[12px] font-semibold text-aura-muted transition-colors hover:bg-white/75 hover:text-aura-primary md:px-4"
        >
          <LayoutDashboard aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Ke dasbor</span>
          <span className="sr-only sm:hidden">Ke dasbor</span>
        </Link>
      </header>

      <div
        className={
          aksi
            ? "flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8"
            : "flex flex-1 flex-col"
        }
      >
        <main
          className={
            aksi
              ? "flex min-w-0 flex-1 flex-col gap-6 pt-2 pb-28 lg:max-w-[720px] lg:pt-4 lg:pb-10"
              : "flex min-w-0 flex-1 flex-col gap-6 pt-2 pb-10 lg:max-w-[960px] lg:pt-4"
          }
        >
          {children}
        </main>

        {aksi && (
          <aside
            aria-label="Aksi halaman"
            className="sticky bottom-0 z-20 -mx-4 flex flex-col gap-3 border-t border-white/70 bg-aura-canvas/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:top-6 lg:z-auto lg:mx-0 lg:mt-0 lg:w-full lg:self-start lg:rounded-[24px] lg:border lg:border-white/60 lg:bg-white/70 lg:p-4 lg:shadow-[0_12px_40px_-16px_rgba(37,99,235,0.28)]"
          >
            {aksi}
          </aside>
        )}
      </div>
    </div>
  );
}
