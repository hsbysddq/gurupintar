"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Loader2, LogOut } from "lucide-react";
import { LogoGuruPintar } from "@/components/LogoGuruPintar";
import { NavigasiSiswa } from "@/components/NavigasiSiswa";
import { useSiswa } from "@/components/PenyediaSiswa";
import { keluar } from "@/lib/api-klien";

function inisial(nama: string) {
  const hasil = nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? "")
    .join("");
  return hasil || "S";
}

/**
 * Kerangka dasbor siswa. Tata letaknya sama dengan KerangkaGuru: sidebar penuh 280px di ≥1280px,
 * hanya ikon 76px di 768–1279px, dan bar atas di bawah 768px.
 * Halaman alur kuis (format, kuis, materi, selesai) tetap memakai KerangkaSiswa yang sempit.
 */
export function KerangkaDasborSiswa({ children }: { children: ReactNode }) {
  const router = useRouter();
  const profil = useSiswa();
  const [keluarMemuat, setKeluarMemuat] = useState(false);

  async function keluarAkun() {
    setKeluarMemuat(true);
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
          aria-label="Guru Pintarku, ke beranda"
          className="flex min-h-12 shrink-0 items-center gap-2 px-0.5 md:justify-center xl:justify-start xl:gap-3 xl:px-1"
        >
          <LogoGuruPintar className="h-7 w-auto shrink-0 xl:h-10" />
          <span className="hidden min-w-0 flex-col xl:flex">
            <span className="truncate font-display text-[18px] leading-[24px] font-bold tracking-tight text-aura-ink">
              Guru Pintarku
            </span>
            <span className="font-body text-[11px] leading-[16px] font-semibold text-aura-muted">
              Kurikulum Merdeka
            </span>
          </span>
        </Link>

        <nav aria-label="Menu siswa" className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <NavigasiSiswa />
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-2 xl:border-t xl:border-white/60 xl:pt-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/60 bg-white/45 p-2.5 xl:flex">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-aura-amber via-aura-red to-aura-violet p-0.5">
              <span className="flex size-full items-center justify-center rounded-full bg-white font-display text-[11px] font-extrabold tracking-tight text-aura-indigo">
                {inisial(profil.nama)}
              </span>
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[14px] leading-[20px] font-semibold text-aura-ink">{profil.nama}</p>
              <p className="font-body text-[11px] leading-[16px] text-aura-muted">Siswa</p>
            </div>
          </div>

          <button
            type="button"
            onClick={keluarAkun}
            disabled={keluarMemuat}
            aria-busy={keluarMemuat || undefined}
            title="Keluar"
            className="group flex min-h-12 shrink-0 items-center justify-center gap-0 rounded-2xl px-1 text-[15px] font-semibold text-aura-muted transition-colors hover:bg-aura-red/10 hover:text-aura-red disabled:cursor-wait disabled:opacity-60 md:rounded-xl xl:justify-start xl:gap-3 xl:rounded-2xl xl:px-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/60 ring-1 ring-white/70 transition-colors group-hover:bg-aura-red/10 group-hover:ring-aura-red/15">
              {keluarMemuat ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <LogOut aria-hidden="true" className="size-4" />
              )}
            </span>
            <span className="sr-only xl:not-sr-only">Keluar</span>
          </button>
        </div>
      </aside>

      <div className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-3 px-4 pt-4 md:px-8 md:pt-6">
          <details className="relative">
            <summary
              aria-label="Notifikasi"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/60 bg-white/60 text-aura-muted hover:text-aura-primary [&::-webkit-details-marker]:hidden"
            >
              <Bell aria-hidden="true" className="size-5" />
            </summary>
            <div className="kaca-pekat absolute top-full right-0 z-30 mt-2 w-64 p-4 text-[13px] leading-normal text-aura-muted">
              Belum ada notifikasi.
            </div>
          </details>

          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-full border border-white/60 bg-white/60 py-1 pr-3 pl-1 [&::-webkit-details-marker]:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-aura-violet/15 font-display text-[12px] font-extrabold text-aura-indigo">
                {inisial(profil.nama)}
              </span>
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="max-w-40 truncate font-display text-[13px] leading-[18px] font-semibold text-aura-ink">
                  {profil.nama}
                </span>
                <span className="font-body text-[11px] leading-[14px] text-aura-muted">Siswa</span>
              </span>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-aura-muted" />
            </summary>
            <div className="kaca-pekat absolute top-full right-0 z-30 mt-2 w-48 p-2">
              <button
                type="button"
                onClick={keluarAkun}
                disabled={keluarMemuat}
                aria-busy={keluarMemuat || undefined}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-aura-muted hover:bg-aura-red/10 hover:text-aura-red disabled:cursor-wait disabled:opacity-60"
              >
                {keluarMemuat ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <LogOut aria-hidden="true" className="size-4" />
                )}
                {keluarMemuat ? "Keluar…" : "Keluar"}
              </button>
            </div>
          </details>
        </div>

        <main className="w-full flex-1 px-4 py-6 text-[15px] leading-relaxed md:p-8">{children}</main>
      </div>
    </div>
  );
}
