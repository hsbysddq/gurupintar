'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { susunGrafikKoin } from '@/lib/koin';
import type { JenisTransaksiKoin, TransaksiKoin } from '@/lib/tipe';

const FORMAT_WAKTU = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const JENIS: Record<
  JenisTransaksiKoin,
  { label: string; status: string; ikon: LucideIcon; kelasStatus: string; kelasIkon: string }
> = {
  generate_modul: {
    label: 'Generate materi',
    status: 'Pemakaian',
    ikon: Sparkles,
    kelasStatus: 'bg-aura-amber/10 text-[#92400e]',
    kelasIkon: 'bg-aura-amber/10 text-[#92400e]',
  },
  refund: {
    label: 'Koin dikembalikan',
    status: 'Dikembalikan',
    ikon: ArrowDownLeft,
    kelasStatus: 'bg-aura-emerald/10 text-[#047857]',
    kelasIkon: 'bg-aura-emerald/10 text-[#047857]',
  },
  topup: {
    label: 'Top up koin',
    status: 'Masuk',
    ikon: Plus,
    kelasStatus: 'bg-aura-primary/10 text-aura-primary',
    kelasIkon: 'bg-aura-primary/10 text-aura-primary',
  },
  bonus_awal: {
    label: 'Bonus koin',
    status: 'Bonus',
    ikon: Coins,
    kelasStatus: 'bg-aura-violet/10 text-aura-violet',
    kelasIkon: 'bg-aura-violet/10 text-aura-violet',
  },
  penyesuaian: {
    label: 'Penyesuaian koin',
    status: 'Penyesuaian',
    ikon: RefreshCw,
    kelasStatus: 'bg-aura-ink/5 text-aura-muted',
    kelasIkon: 'bg-aura-ink/5 text-aura-muted',
  },
};

function formatKoin(nilai: number): string {
  return `${nilai > 0 ? '+' : ''}${nilai}`;
}

function KartuStatistik({
  label,
  nilai,
  keterangan,
  ikon: Ikon,
  warna,
}: {
  label: string;
  nilai: string | number;
  keterangan: string;
  ikon: LucideIcon;
  warna: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/65 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">{label}</p>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${warna}`}>
          <Ikon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-[28px] leading-[34px] font-extrabold tracking-[-0.02em] tabular-nums text-aura-ink">
        {nilai}
      </p>
      <p className="mt-0.5 font-body text-[11px] leading-[16px] text-aura-muted">{keterangan}</p>
    </div>
  );
}

export function RiwayatKoin({
  transaksi,
  memuat,
  galat,
  tertanam = false,
  onCobaLagi,
}: {
  transaksi: TransaksiKoin[];
  memuat: boolean;
  galat: string | null;
  tertanam?: boolean;
  onCobaLagi: () => void;
}) {
  const grafik = susunGrafikKoin(transaksi);
  const totalKeluar = grafik.reduce((jumlah, hari) => jumlah + hari.keluar, 0);
  const totalMasuk = grafik.reduce((jumlah, hari) => jumlah + hari.masuk, 0);
  const maks = Math.max(1, ...grafik.flatMap((hari) => [hari.keluar, hari.masuk]));
  const adaAktivitas = totalKeluar > 0 || totalMasuk > 0;

  if (memuat) {
    return (
      <section
        aria-labelledby="judul-riwayat-koin"
        className={tertanam ? 'flex items-center gap-3' : 'aura-glass flex items-center gap-3 rounded-[24px] p-5'}
      >
        <Loader2 aria-hidden="true" className="size-5 animate-spin text-aura-primary" />
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">Memuat riwayat koin…</p>
      </section>
    );
  }

  if (galat) {
    return (
      <section
        aria-labelledby="judul-riwayat-koin"
        className={
          tertanam ? 'flex flex-col items-start gap-3' : 'aura-glass flex flex-col items-start gap-3 rounded-[24px] p-5'
        }
      >
        <span className="flex size-10 items-center justify-center rounded-2xl bg-aura-amber/10 text-[#92400e]">
          <History aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 id="judul-riwayat-koin" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
            Riwayat koin belum bisa dimuat
          </h2>
          <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">{galat}</p>
        </div>
        <button type="button" onClick={onCobaLagi} className="aura-btn aura-btn-secondary h-10 px-4 text-[12px]">
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Coba lagi
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="judul-riwayat-koin"
      className={tertanam ? 'min-w-0' : 'aura-glass rounded-[24px] p-4 sm:p-5'}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
            <History aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="judul-riwayat-koin" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
              Riwayat koin
            </h2>
            <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
              Pemakaian dan pengembalian koin dari setiap generate materi.
            </p>
          </div>
        </div>
        <button type="button" onClick={onCobaLagi} className="aura-btn aura-btn-secondary h-10 px-3 text-[12px]">
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Muat ulang
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <KartuStatistik
          label="Terpakai 7 hari"
          nilai={totalKeluar}
          keterangan="koin untuk generate"
          ikon={ArrowUpRight}
          warna="bg-aura-amber/10 text-[#92400e]"
        />
        <KartuStatistik
          label="Kembali 7 hari"
          nilai={totalMasuk}
          keterangan="refund dan top up"
          ikon={ArrowDownLeft}
          warna="bg-aura-emerald/10 text-[#047857]"
        />
        <KartuStatistik
          label="Transaksi"
          nilai={transaksi.length}
          keterangan="aktivitas terbaru"
          ikon={History}
          warna="bg-aura-violet/10 text-aura-violet"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/70 bg-white/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-[14px] leading-[20px] font-bold text-aura-ink">Aktivitas 7 hari</h3>
            <p className="font-body text-[11px] leading-[16px] text-aura-muted">Koin keluar dan masuk per hari.</p>
          </div>
          <div className="flex items-center gap-3 font-body text-[10px] leading-[14px] font-medium text-aura-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-sm bg-[#F26A3D]" />
              Keluar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-sm bg-aura-emerald" />
              Masuk
            </span>
          </div>
        </div>

        {adaAktivitas ? (
          <div
            role="img"
            aria-label="Grafik koin keluar dan masuk selama tujuh hari terakhir"
            className="mt-4 flex h-44 items-end gap-1.5"
          >
            {grafik.map((hari) => (
              <div key={hari.kunci} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex h-36 w-full items-end justify-center gap-1">
                  <div
                    title={`Keluar ${hari.keluar} koin`}
                    className="w-3 rounded-t-md bg-[#F26A3D] transition-[height] duration-300 sm:w-4"
                    style={{ height: `${(hari.keluar / maks) * 100}%`, minHeight: hari.keluar > 0 ? 3 : 0 }}
                  />
                  <div
                    title={`Masuk ${hari.masuk} koin`}
                    className="w-3 rounded-t-md bg-aura-emerald transition-[height] duration-300 sm:w-4"
                    style={{ height: `${(hari.masuk / maks) * 100}%`, minHeight: hari.masuk > 0 ? 3 : 0 }}
                  />
                </div>
                <span className="truncate font-display text-[10px] font-semibold text-aura-muted">{hari.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-aura-ink/10 bg-white/35 px-4 text-center">
            <History aria-hidden="true" className="size-5 text-aura-muted" />
            <p className="mt-2 font-body text-[12px] leading-[18px] text-aura-muted">
              Belum ada aktivitas koin dalam 7 hari terakhir.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 min-w-0 rounded-2xl border border-white/70 bg-white/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[14px] leading-[20px] font-bold text-aura-ink">Transaksi terbaru</h3>
          <span className="font-body text-[11px] leading-[16px] text-aura-muted">{transaksi.length} aktivitas</span>
        </div>

        {transaksi.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-aura-ink/10 bg-white/35 px-4 py-10 text-center">
            <Coins aria-hidden="true" className="size-5 text-aura-muted" />
            <p className="mt-2 font-body text-[12px] leading-[18px] text-aura-muted">
              Belum ada riwayat. Generate materi pertama untuk mulai mencatat pemakaian koin.
            </p>
          </div>
        ) : (
          <ul className="mt-2 max-h-[420px] divide-y divide-aura-ink/5 overflow-y-auto pr-1">
            {transaksi.map((item) => {
              const info = JENIS[item.jenis] ?? JENIS.penyesuaian;
              const Ikon = info.ikon;
              const positif = item.jumlah > 0;
              return (
                <li
                  key={item.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-1 last:pb-1"
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${info.kelasIkon}`}>
                    <Ikon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[12px] leading-[18px] font-semibold text-aura-ink">
                      {info.label}
                    </p>
                    <p className="truncate font-body text-[11px] leading-[16px] text-aura-muted">
                      {FORMAT_WAKTU.format(new Date(item.dibuatPada))}
                      {item.keterangan ? ` · ${item.keterangan}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p
                      className={`font-display text-[13px] leading-[18px] font-bold tabular-nums ${
                        positif ? 'text-[#047857]' : 'text-[#92400e]'
                      }`}
                    >
                      {formatKoin(item.jumlah)} koin
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.04em] ${info.kelasStatus}`}
                    >
                      {info.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 font-body text-[11px] leading-[16px] text-aura-muted">
        Jika generate gagal, koin dikembalikan otomatis dan muncul sebagai transaksi “Koin dikembalikan”.
      </p>
    </section>
  );
}
