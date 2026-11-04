"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Loader2, LogOut } from "lucide-react";
import { LogoGuruPintar, TulisanGuruPintar } from "@/components/LogoGuruPintar";
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
 * hanya ikon 76px di 768–1279px. Di bawah 768px: bar atas berisi logo, notifikasi, dan profil,
 * sedangkan menu pindah ke bilah tab di dasar layar agar tidak berdesakan.
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

  const aksiAtas = (
    <>
      <details className="relative">
        <summary
          aria-label="Notifikasi"
          className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/60 bg-white/60 text-aura-muted hover:text-aura-primary [&::-webkit-details-marker]:hidden"
        >
          <Bell aria-hidden="true" className="size-5" />
        </summary>
        <div className="aura-glass-strong absolute top-full right-0 z-30 mt-2 w-64 rounded-2xl p-4 text-[13px] leading-normal text-aura-muted">
          Belum ada notifikasi.
        </div>
      </details>

      <details className="relative">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-white/60 bg-white/60 py-1 pr-2.5 pl-1 sm:gap-3 sm:pr-3 [&::-webkit-details-marker]:hidden">
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
        <div className="aura-glass-strong absolute top-full right-0 z-30 mt-2 w-48 rounded-2xl p-2">
          <p className="truncate px-3 pt-1 pb-2 font-display text-[13px] font-semibold text-aura-ink sm:hidden">
            {profil.nama}
          </p>
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
    </>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-x-clip md:flex-row">
      <aside className="aura-glass sticky top-0 z-20 m-2 flex shrink-0 flex-row items-center justify-between gap-2 rounded-[24px] p-2 md:m-3 md:h-[calc(100vh-1.5rem)] md:w-[76px] md:flex-col md:items-stretch md:justify-start md:gap-3 md:p-3 xl:w-[280px] xl:p-4">
        <Link
          href="/"
          aria-label="Guru Pintarku, ke beranda"
          className="flex min-h-12 shrink-0 items-center gap-2 px-1 md:justify-center xl:justify-start xl:gap-3"
        >
          <TulisanGuruPintar className="h-6 w-auto shrink-0 md:hidden xl:block xl:h-7" />
          <LogoGuruPintar className="hidden h-9 w-auto shrink-0 md:block xl:hidden" />
        </Link>

        {/* Ponsel: notifikasi dan profil berada di bar atas, sejajar dengan logo. */}
        <div className="flex items-center gap-2 md:hidden">{aksiAtas}</div>

        <nav aria-label="Menu siswa" className="hidden min-w-0 flex-1 md:flex">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <NavigasiSiswa />
          </div>
        </nav>

        <div className="mt-auto hidden flex-col gap-2 md:flex xl:border-t xl:border-white/60 xl:pt-3">
          <button
            type="button"
            onClick={keluarAkun}
            disabled={keluarMemuat}
            aria-busy={keluarMemuat || undefined}
            title="Keluar"
            className="group flex min-h-12 shrink-0 items-center justify-center gap-0 rounded-xl px-1 text-[15px] font-semibold text-aura-muted transition-colors hover:bg-aura-red/10 hover:text-aura-red disabled:cursor-wait disabled:opacity-60 xl:justify-start xl:gap-3 xl:rounded-2xl xl:px-3"
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
        <div className="hidden items-center justify-end gap-3 px-8 pt-6 md:flex">{aksiAtas}</div>

        <main className="w-full min-w-0 flex-1 px-4 pt-3 pb-28 text-[15px] leading-relaxed md:p-8">{children}</main>
      </div>

      {/* Ponsel: menu utama sebagai bilah tab di dasar layar. */}
      <nav
        aria-label="Menu siswa"
        className="aura-glass-strong fixed inset-x-2 bottom-2 z-20 rounded-[24px] p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <NavigasiSiswa tampilan="bawah" />
      </nav>
    </div>
  );
}
