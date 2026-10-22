"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ChartColumn, Copy } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";

type PanelKodeKelasProps = {
  kodeKelas: string;
  urlGabung: string;
  /** Tujuan tombol "Lihat hasil" (`/guru/hasil?sesi=`). */
  urlHasil: string;
  onTutup: () => void;
  sedangMenutup: boolean;
};

export function PanelKodeKelas({ kodeKelas, urlGabung, urlHasil, onTutup, sedangMenutup }: PanelKodeKelasProps) {
  const [qr, setQr] = useState<{ url: string; gambar: string | null } | null>(null);
  const [disalin, setDisalin] = useState(false);

  // QR dibuat di browser, bukan dari layanan eksternal (design.md 4.6).
  useEffect(() => {
    let aktif = true;
    QRCode.toDataURL(urlGabung, { margin: 1, width: 240 })
      .then((gambar) => {
        if (aktif) setQr({ url: urlGabung, gambar });
      })
      .catch(() => {
        if (aktif) setQr({ url: urlGabung, gambar: null });
      });
    return () => {
      aktif = false;
    };
  }, [urlGabung]);

  useEffect(() => {
    if (!disalin) return;
    const jadwal = setTimeout(() => setDisalin(false), 2000);
    return () => clearTimeout(jadwal);
  }, [disalin]);

  async function salinKode() {
    try {
      await navigator.clipboard.writeText(kodeKelas);
      setDisalin(true);
    } catch {
      setDisalin(false);
    }
  }

  return (
    <KartuKaca as="section" className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-[13px] leading-normal font-medium text-tinta-lembut">Kode kelas</h2>
        <p className="text-[36px] leading-[1.1] font-bold tracking-[0.12em] break-words text-tinta sm:text-[52px] sm:tracking-[0.18em] xl:text-[56px] xl:tracking-[0.2em]">
          {kodeKelas}
        </p>
        <p className="max-w-prose text-[15px] leading-relaxed text-tinta-lembut">
          Minta siswa membuka Guru Pintar dan memasukkan kode ini, atau memindai kode QR.
        </p>
        <div className="flex items-center gap-2">
          <Tombol varian="teks" ikon={Copy} onClick={salinKode}>
            Salin kode
          </Tombol>
          <span role="status" aria-live="polite" className="text-[13px] leading-normal font-medium text-sudah-teks">
            {disalin ? "Kode disalin." : ""}
          </span>
        </div>
      </div>

      <div className="flex size-[200px] max-w-full shrink-0 items-center justify-center self-center rounded-kecil bg-white sm:size-[240px]">
        {qr?.url === urlGabung && qr.gambar ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL buatan browser, bukan berkas gambar
          <img
            src={qr.gambar}
            alt="QR untuk bergabung ke kuis"
            width={240}
            height={240}
            className="h-full w-full object-contain"
          />
        ) : qr?.url === urlGabung ? (
          <p className="p-4 text-center text-[13px] leading-normal font-medium text-tinta-lembut">
            QR belum berhasil dibuat. Siswa tetap bisa memakai kode kelas.
          </p>
        ) : (
          <div aria-hidden="true" className="size-full animate-pulse rounded-kecil bg-tinta/10" />
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch xl:flex-row">
        <Link
          href={urlHasil}
          className="kaca inline-flex h-12 items-center justify-center gap-2 rounded-tombol px-6 font-semibold text-primer transition-colors hover:bg-primer-lembut"
        >
          <ChartColumn aria-hidden="true" className="size-5" />
          Lihat hasil
        </Link>
        <Tombol varian="sekunder" memuat={sedangMenutup} onClick={onTutup}>
          Tutup kuis
        </Tombol>
      </div>
    </KartuKaca>
  );
}
