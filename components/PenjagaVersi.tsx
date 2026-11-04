"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles, Wrench, X } from "lucide-react";

const INTERVAL_MS = 30_000;
const BATAS_CEK_MS = 8_000;
const JEDA_KONFIRMASI_MS = 2_000;

type ResponsVersi = { versi?: string | null; maintenance?: boolean };
type Pemberitahuan = { jenis: "maintenance" } | { jenis: "versi"; versi: string };

/**
 * `versiAwal` adalah build ID halaman yang sedang dimuat, diambil server saat render.
 * Dengan begitu perbandingan tidak bergantung pada request polling pertama.
 */
export function PenjagaVersi({ versiAwal }: { versiAwal: string | null }) {
  const [pemberitahuan, setPemberitahuan] = useState<Pemberitahuan | null>(null);
  const acuan = useRef<string | null>(versiAwal && versiAwal !== "dev" ? versiAwal : null);
  const kandidat = useRef<string | null>(null);
  const versiDiabaikan = useRef<string | null>(null);

  useEffect(() => {
    let aktif = true;
    let sedangCek = false;
    let konfirmasi: number | undefined;

    async function cek() {
      // Jangan menumpuk request saat jaringan lambat atau tab baru kembali aktif.
      if (sedangCek) return;
      sedangCek = true;
      const pengendali = new AbortController();
      const batas = setTimeout(() => pengendali.abort(), BATAS_CEK_MS);

      try {
        const res = await fetch("/api/versi", {
          cache: "no-store",
          credentials: "same-origin",
          signal: pengendali.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as ResponsVersi;
        if (!aktif) return;

        if (data.maintenance) {
          setPemberitahuan({ jenis: "maintenance" });
          return;
        }

        // Maintenance sudah selesai: hilangkan modal maintenance, tetapi jangan ganggu
        // pemberitahuan versi yang mungkin sedang tampil.
        setPemberitahuan((lama) => (lama?.jenis === "maintenance" ? null : lama));

        // Jaringan lambat, server mati, atau BUILD_ID belum tersedia bukan maintenance.
        if (!data.versi || data.versi === "dev") return;

        if (!acuan.current) {
          acuan.current = data.versi;
          return;
        }

        if (data.versi === acuan.current) {
          kandidat.current = null;
          setPemberitahuan((lama) => (lama?.jenis === "versi" ? null : lama));
          return;
        }

        if (versiDiabaikan.current === data.versi) return;

        // Satu respons yang berbeda belum cukup: minta konfirmasi sekali lagi
        // agar backend lama/baru yang sempat bergantian tidak memunculkan notifikasi palsu.
        if (kandidat.current === data.versi) {
          setPemberitahuan({ jenis: "versi", versi: data.versi });
          return;
        }

        kandidat.current = data.versi;
        if (konfirmasi) window.clearTimeout(konfirmasi);
        konfirmasi = window.setTimeout(() => {
          konfirmasi = undefined;
          void cek();
        }, JEDA_KONFIRMASI_MS);
      } catch {
        // Timeout/offline bukan tanda maintenance. Cek berikutnya akan mencoba lagi.
      } finally {
        clearTimeout(batas);
        sedangCek = false;
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
      if (konfirmasi) window.clearTimeout(konfirmasi);
      clearInterval(pengatur);
      window.removeEventListener("focus", saatFokus);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  const maintenance = pemberitahuan?.jenis === "maintenance";

  useEffect(() => {
    if (!maintenance) return;
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = sebelumnya;
    };
  }, [maintenance]);

  if (pemberitahuan?.jenis === "maintenance") {
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

  if (pemberitahuan?.jenis !== "versi") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-sm rounded-[22px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35)] backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
          <Sparkles aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[14px] leading-snug font-bold text-aura-ink">Versi baru tersedia</p>
          <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
            Muat ulang untuk memakai pembaruan terbaru. Pekerjaan yang sedang berjalan sebaiknya diselesaikan dulu.
          </p>
        </div>
        <button
          type="button"
          aria-label="Tutup pemberitahuan"
          onClick={() => {
            versiDiabaikan.current = pemberitahuan.versi;
            setPemberitahuan(null);
          }}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="aura-btn aura-btn-primary h-10 flex-1 px-3 text-[12px]"
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Muat ulang
        </button>
        <button
          type="button"
          onClick={() => {
            versiDiabaikan.current = pemberitahuan.versi;
            setPemberitahuan(null);
          }}
          className="aura-btn aura-btn-secondary h-10 px-3 text-[12px]"
        >
          Nanti
        </button>
      </div>
    </div>
  );
}
