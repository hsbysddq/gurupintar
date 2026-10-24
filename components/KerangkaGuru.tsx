"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { LogoGuruPintar } from "@/components/LogoGuruPintar";
import { NavigasiGuru, type KelasNav } from "@/components/NavigasiGuru";
import { keluar } from "@/lib/api-klien";

type KerangkaGuruProps = {
  children: ReactNode;
  nama: string;
  kelas: KelasNav[];
};

function inisial(nama: string) {
  const hasil = nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? "")
    .join("");
  return hasil || "G";
}

/**
 * Kerangka semua halaman guru (design.md 3.1, 3.7): sidebar penuh 280px di ≥1280px,
 * hanya ikon 76px di 768–1279px, dan bar atas di bawah 768px.
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
      <aside className="aura-glass sticky top-0 z-20 m-2 flex shrink-0 flex-row items-center gap-1 rounded-[24px] p-2 sm:gap-3 md:m-3 md:h-[calc(100vh-1.5rem)] md:w-[76px] md:flex-col md:items-stretch md:gap-3 md:p-3 xl:w-[280px] xl:p-4">
        <Link
          href="/"
          aria-label="Guru Pintar, ke beranda"
          className="flex min-h-12 shrink-0 items-center gap-2 px-0.5 md:justify-center xl:justify-start xl:gap-3 xl:px-1"
        >
          <LogoGuruPintar className="h-7 w-auto shrink-0 xl:h-10" />
          <span className="hidden min-w-0 flex-col xl:flex">
            <span className="truncate font-display text-[18px] leading-[24px] font-bold tracking-tight text-aura-ink">
              Guru Pintar
            </span>
            <span className="font-body text-[11px] leading-[16px] font-semibold text-aura-muted">
              Kurikulum Merdeka
            </span>
          </span>
        </Link>

        <nav aria-label="Menu guru" className="flex min-w-0 flex-1">
          <Suspense fallback={null}>
            <NavigasiGuru kelas={kelas} />
          </Suspense>
        </nav>

        <div className="mt-auto flex flex-col gap-2 xl:border-t xl:border-white/60 xl:pt-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/60 bg-white/45 p-2.5 xl:flex">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-aura-amber via-aura-red to-aura-violet p-0.5">
              <span className="flex size-full items-center justify-center rounded-full bg-white font-display text-[11px] font-extrabold tracking-tight text-aura-indigo">
                {inisial(nama)}
              </span>
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[14px] leading-[20px] font-semibold text-aura-ink">{nama}</p>
              <p className="font-body text-[11px] leading-[16px] text-aura-muted">Guru</p>
            </div>
          </div>

          <button
            type="button"
            onClick={keluarAkun}
            title="Keluar"
            className="group flex min-h-12 shrink-0 items-center justify-center gap-0 rounded-2xl px-1 text-[15px] font-semibold text-aura-muted transition-colors hover:bg-aura-red/10 hover:text-aura-red md:rounded-xl xl:justify-start xl:gap-3 xl:rounded-2xl xl:px-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/60 ring-1 ring-white/70 transition-colors group-hover:bg-aura-red/10 group-hover:ring-aura-red/15">
              <LogOut aria-hidden="true" className="size-4" />
            </span>
            <span className="sr-only xl:not-sr-only">Keluar</span>
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 text-[15px] leading-relaxed md:p-8">{children}</main>
    </div>
  );
}
