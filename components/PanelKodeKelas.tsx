'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Activity, ChartColumn, Check, Copy, Loader2, Users } from 'lucide-react';

type PanelKodeKelasProps = {
  kodeKelas: string;
  urlGabung: string;
  /** Tujuan tombol "Lihat hasil" (`/guru/hasil?sesi=`). */
  urlHasil: string;
  jumlahSiswa: number;
  jumlahMenjawab: number;
  onTutup: () => void;
  sedangMenutup: boolean;
};

export function PanelKodeKelas({
  kodeKelas,
  urlGabung,
  urlHasil,
  jumlahSiswa,
  jumlahMenjawab,
  onTutup,
  sedangMenutup,
}: PanelKodeKelasProps) {
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

  const persen = jumlahSiswa > 0 ? Math.min(100, Math.round((jumlahMenjawab / jumlahSiswa) * 100)) : 0;

  return (
    <section aria-label="Kuis aktif" className="aura-glass-strong relative overflow-hidden rounded-[28px] p-5 sm:p-6 lg:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-aura-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-aura-violet/10 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="aura-eyebrow">
              <Activity aria-hidden="true" className="size-3.5" />
              Kuis aktif
            </span>
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-aura-emerald/10 px-2.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-[#047857]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />
              Live
            </span>
          </div>

          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">Kode kuis</p>
            <p className="mt-1 break-words font-display text-[38px] leading-[1.1] font-extrabold tracking-[0.1em] text-aura-ink sm:text-[56px] sm:tracking-[0.16em]">
              {kodeKelas}
            </p>
            <p className="mt-2 max-w-prose font-body text-[14px] leading-[22px] text-aura-muted">
              Bagikan kode atau QR ini. Siswa bergabung dari HP, lalu menjawab soal.
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/45 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                Siswa menjawab
              </span>
              <span className="inline-flex items-center gap-1.5 font-display text-[13px] font-bold text-aura-ink">
                <Users aria-hidden="true" className="size-3.5 text-aura-primary" />
                {jumlahMenjawab}/{jumlahSiswa}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Siswa yang sudah menjawab"
              aria-valuemin={0}
              aria-valuemax={jumlahSiswa}
              aria-valuenow={jumlahMenjawab}
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-aura-primary/10 ring-1 ring-inset ring-white/80"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-aura-primary to-aura-indigo transition-[width] duration-300"
                style={{ width: `${persen}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={salinKode}
              className="aura-btn aura-btn-secondary h-11 px-4 text-[13px]"
            >
              {disalin ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
              {disalin ? 'Tersalin' : 'Salin kode'}
            </button>
            <span role="status" aria-live="polite" className="font-body text-[12px] leading-[18px] font-medium text-[#047857]">
              {disalin ? 'Kode disalin.' : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex size-[200px] max-w-full items-center justify-center rounded-[20px] border border-white/70 bg-white p-2 shadow-[0_12px_32px_-16px_rgba(37,99,235,0.35)] sm:size-[240px]">
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
              <p className="p-4 text-center font-body text-[12px] leading-[18px] font-medium text-aura-muted">
                QR belum berhasil dibuat. Siswa tetap bisa memakai kode kuis.
              </p>
            ) : (
              <div aria-hidden="true" className="size-full animate-pulse rounded-[12px] bg-aura-primary/10" />
            )}
          </div>
          <p className="font-body text-[11px] leading-[16px] text-aura-muted">Pindai untuk bergabung</p>
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={urlHasil} className="aura-btn aura-btn-primary h-12 w-full px-6 text-[15px] sm:w-auto">
          <ChartColumn aria-hidden="true" className="size-4" />
          Lihat hasil
        </Link>
        <button
          type="button"
          onClick={onTutup}
          disabled={sedangMenutup}
          className="aura-btn aura-btn-danger h-12 w-full px-6 text-[15px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {sedangMenutup ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          Tutup kuis
        </button>
      </div>
    </section>
  );
}
