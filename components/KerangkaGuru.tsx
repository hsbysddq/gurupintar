"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { NavigasiGuru, type KelasNav } from "@/components/NavigasiGuru";
import { keluar } from "@/lib/api-klien";

type KerangkaGuruProps = {
  children: ReactNode;
  nama: string;
  kelas: KelasNav[];
};

/**
 * Kerangka semua halaman guru (design.md 3.1, 3.7): sidebar penuh 248px di ≥1280px,
 * hanya ikon 72px di 768–1279px, dan bar atas di bawah 768px.
 */
export function KerangkaGuru({ children, nama, kelas }: KerangkaGuruProps) {
  const router = useRouter();

  async function keluarAkun() {
    try {
      await keluar();
    } finally {
      router.replace("/masuk");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="kaca sticky top-0 z-10 m-3 flex shrink-0 flex-row items-center gap-3 p-3 md:m-4 md:h-[calc(100vh-2rem)] md:w-[72px] md:flex-col md:items-stretch xl:w-[248px] xl:p-4">
        <Link href="/" className="flex min-h-12 items-center gap-2 px-2 font-bold md:justify-center xl:justify-start">
          <GraduationCap aria-hidden="true" className="size-6 shrink-0 text-primer" />
          <span className="md:sr-only xl:not-sr-only">Guru Pintar</span>
        </Link>

        <nav aria-label="Menu guru" className="flex flex-1">
          <Suspense fallback={null}>
            <NavigasiGuru kelas={kelas} />
          </Suspense>
        </nav>

        <div className="mt-auto hidden flex-col gap-2 px-2 xl:flex">
          <span className="text-[15px] font-semibold">{nama}</span>
          <span className="text-[13px] leading-normal font-medium text-tinta-lembut">Guru</span>
        </div>

        <button
          type="button"
          onClick={keluarAkun}
          title="Keluar"
          className="flex min-h-12 items-center gap-3 rounded-full px-3 text-[15px] font-semibold text-tinta-lembut transition-colors hover:bg-belum-latar hover:text-belum-teks md:justify-center xl:justify-start xl:px-4"
        >
          <LogOut aria-hidden="true" className="size-5 shrink-0" />
          <span className="sr-only sm:not-sr-only md:sr-only xl:not-sr-only">Keluar</span>
        </button>
      </aside>

      <main className="w-full max-w-[1200px] flex-1 px-4 py-6 text-[15px] leading-relaxed md:p-8">{children}</main>
    </div>
  );
}
