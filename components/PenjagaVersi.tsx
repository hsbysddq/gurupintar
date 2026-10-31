"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Wrench } from "lucide-react";

const INTERVAL_MS = 30_000;
const BATAS_GAGAL = 3;

type ResponsVersi = { versi?: string; maintenance?: boolean };

/** Memunculkan modal saat server sudah memakai build baru atau sedang maintenance. */
export function PenjagaVersi() {
  const [tampil, setTampil] = useState(false);
  const versiAwal = useRef<string | null>(null);

  useEffect(() => {
    let aktif = true;
    let gagal = 0;

    async function cek() {
      try {
        const res = await fetch("/api/versi", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Versi tidak tersedia.");
        const data = (await res.json()) as ResponsVersi;
        if (!aktif) return;
        gagal = 0;
        if (data.maintenance) {
          setTampil(true);
          return;
        }
        if (!data.versi) return;
        if (!versiAwal.current) {
          versiAwal.current = data.versi;
          return;
        }
        if (data.versi !== versiAwal.current) setTampil(true);
      } catch {
        if (!aktif) return;
        gagal += 1;
        if (gagal >= BATAS_GAGAL) setTampil(true);
      }
    }

    const pengatur = setInterval(() => void cek(), INTERVAL_MS);
    const saatFokus = () => void cek();
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") void cek();
    };

    void cek();
    window.addEventListener("focus", saatFokus);
    document.addEventListener("visibilitychange", saatTerlihat);

    return () => {
      aktif = false;
      clearInterval(pengatur);
      window.removeEventListener("focus", saatFokus);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  useEffect(() => {
    if (!tampil) return;
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = sebelumnya;
    };
  }, [tampil]);

  if (!tampil) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="judul-maintenance"
      aria-describedby="pesan-maintenance"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-aura-ink/35 p-4 backdrop-blur-sm"
    >
      <div className="aura-glass-strong w-full max-w-md rounded-[28px] p-6 text-center shadow-2xl">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/80">
          <Wrench aria-hidden="true" className="size-6" />
        </span>
        <h2
          id="judul-maintenance"
          className="mt-4 font-display text-[22px] leading-[30px] font-extrabold tracking-[-0.02em] text-aura-ink"
        >
          Website sedang maintenance
        </h2>
        <p id="pesan-maintenance" className="mt-2 font-body text-[14px] leading-[22px] text-aura-muted">
          Kami sedang memperbarui Guru Pintarku. Muat ulang halaman untuk memakai versi terbaru.
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => window.location.reload()}
          className="aura-btn aura-btn-primary mx-auto mt-5 h-12 px-5 text-[13px]"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Muat ulang sekarang
        </button>
        <p className="mt-3 font-body text-[12px] leading-[18px] text-aura-muted">
          Jika pesan ini masih muncul, tunggu beberapa saat lalu coba lagi.
        </p>
      </div>
    </div>
  );
}
