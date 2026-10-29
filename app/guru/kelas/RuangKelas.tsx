'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowUpRight, CalendarDays, Inbox, Loader2, Plus, Sparkles } from 'lucide-react';
import { PanelKodeKelas } from '@/components/PanelKodeKelas';
import { usePolling } from '@/hooks/use-polling';
import { ambilDaftarSesi, ErrorApi, tutupSesi } from '@/lib/api-klien';
import { INTERVAL_POLLING_GURU_MS } from '@/lib/konstanta';
import type { KelasRingkas, SesiGuru } from '@/lib/tipe';

const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function pesanGalat(err: unknown): string {
  return err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.';
}

// Ruang kerja satu kelas: buka/tutup kuis, kode QR, dan riwayat kuis kelas ini.
export function RuangKelas({ kelas }: { kelas: KelasRingkas }) {
  const router = useRouter();
  const ambilSesi = useCallback(
    (signal: AbortSignal) => ambilDaftarSesi(kelas.id, signal),
    [kelas.id],
  );
  const { data: daftar, galat, memuat, muatUlang } = usePolling(ambilSesi, INTERVAL_POLLING_GURU_MS);

  const [membuka, setMembuka] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [konfirmasiGanti, setKonfirmasiGanti] = useState(false);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

  const sesiAktif = daftar?.find((s) => s.status === 'aktif');

  async function jalankanBuatKuis() {
    setMembuka(true);
    setGalatAksi(null);
    try {
      if (sesiAktif) await tutupSesi(sesiAktif.id);
      setKonfirmasiGanti(false);
      router.push(`/guru/soal?kelas=${encodeURIComponent(kelas.id)}&dari=kelas`);
    } catch (err) {
      setGalatAksi(pesanGalat(err));
    } finally {
      setMembuka(false);
    }
  }

  function bukaKuisBaru() {
    if (sesiAktif) {
      setKonfirmasiGanti(true);
      return;
    }
    void jalankanBuatKuis();
  }

  async function tutupKuis(sesiId: string) {
    setMenutup(true);
    setGalatAksi(null);
    try {
      await tutupSesi(sesiId);
      muatUlang();
      router.refresh();
    } catch (err) {
      setGalatAksi(pesanGalat(err));
    } finally {
      setMenutup(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="judul-kuis" className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-aura-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 size-48 rounded-full bg-aura-violet/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <span className="aura-eyebrow">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Kuis kelas
            </span>
            <h2
              id="judul-kuis"
              className="text-balance font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink"
            >
              Cek pemahaman, tanpa menunggu ulangan.
            </h2>
            <p className="font-body text-[14px] leading-[22px] text-aura-muted">
              Buat soal, bagikan kode atau QR, lalu pantau siswa yang sudah menjawab.
            </p>
          </div>

          <button
            type="button"
            onClick={bukaKuisBaru}
            disabled={membuka || !daftar}
            className="aura-btn aura-btn-primary h-[52px] w-full px-6 text-[15px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto xl:shrink-0"
          >
            {membuka ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
            Buat kuis baru
          </button>
        </div>

        {galatAksi && (
          <div
            role="alert"
            className="relative mt-4 flex items-start gap-2 rounded-2xl border border-aura-red/20 bg-aura-red/5 px-4 py-3 font-body text-[13px] leading-[20px] font-medium text-[#93000a]"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {galatAksi}
          </div>
        )}
      </section>

      {konfirmasiGanti && sesiAktif && (
        <section className="relative overflow-hidden rounded-[24px] border border-aura-amber/25 bg-aura-amber/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-aura-amber">
              <AlertTriangle aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-[16px] leading-[24px] font-semibold text-aura-ink">Kuis masih aktif</h2>
              <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
                Kuis <strong className="tracking-wide text-aura-ink">{sesiAktif.kodeKelas}</strong> masih aktif. Untuk
                membuat kuis baru, kuis ini akan ditutup dan kamu diarahkan membuat soal terlebih dahulu.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void jalankanBuatKuis()}
              disabled={membuka}
              className="aura-btn aura-btn-primary h-11 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {membuka ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              Ya, tutup & buat soal
            </button>
            <button
              type="button"
              onClick={() => setKonfirmasiGanti(false)}
              disabled={membuka}
              className="aura-btn aura-btn-secondary h-11 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        </section>
      )}

      {sesiAktif && (
        <PanelKodeKelas
          kodeKelas={sesiAktif.kodeKelas}
          urlGabung={`${window.location.origin}/siswa/gabung?kode=${sesiAktif.kodeKelas}`}
          urlHasil={`/guru/hasil?sesi=${sesiAktif.id}&kelas=${kelas.id}`}
          jumlahSiswa={kelas.jumlahSiswa}
          jumlahMenjawab={sesiAktif.jumlahMenjawab}
          onTutup={() => tutupKuis(sesiAktif.id)}
          sedangMenutup={menutup}
        />
      )}

      <section aria-labelledby="judul-riwayat" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className="aura-eyebrow">Riwayat</span>
            <h2
              id="judul-riwayat"
              className="mt-2 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink"
            >
              Riwayat kuis
            </h2>
          </div>
          {daftar && daftar.length > 0 && (
            <span className="font-body text-[12px] leading-[18px] text-aura-muted">{daftar.length} sesi</span>
          )}
        </div>

        {memuat ? (
          <PanelMemuat />
        ) : !daftar ? (
          <PanelGagal pesan={galat ?? undefined} onCobaLagi={muatUlang} />
        ) : daftar.length === 0 ? (
          <PanelKosong />
        ) : (
          <div className="aura-glass rounded-[24px] p-2">
            <ul className="flex flex-col">
              {daftar.map((s) => (
                <HistoryRow key={s.id} sesi={s} kelasId={kelas.id} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryRow({ sesi, kelasId }: { sesi: SesiGuru; kelasId: string }) {
  const aktif = sesi.status === 'aktif';
  return (
    <li>
      <Link
        href={`/guru/hasil?sesi=${sesi.id}&kelas=${kelasId}`}
        className="group flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-[18px] px-3 py-3 transition-colors hover:bg-white/55 sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary/10 to-aura-violet/15 text-aura-primary ring-1 ring-white/70">
            <CalendarDays aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="break-words font-display text-[13px] leading-[20px] font-semibold text-aura-ink sm:text-[14px]">
              {FORMAT_TANGGAL.format(new Date(sesi.dibuatPada))}
            </p>
            <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
              Kode <span className="font-semibold tracking-wide text-aura-ink">{sesi.kodeKelas}</span> ·{' '}
              {sesi.jumlahMenjawab} menjawab
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] ${
              aktif ? 'bg-aura-emerald/10 text-[#047857]' : 'bg-white/60 text-aura-muted'
            }`}
          >
            {aktif && <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />}
            {aktif ? 'Aktif' : 'Selesai'}
          </span>
          <ArrowUpRight aria-hidden="true" className="size-4 text-aura-muted transition-colors group-hover:text-aura-primary" />
        </div>
      </Link>
    </li>
  );
}

function PanelMemuat() {
  return (
    <div className="aura-glass flex items-center gap-3 rounded-[24px] p-5">
      <Loader2 aria-hidden="true" className="size-5 animate-spin text-aura-primary" />
      <p className="font-body text-[14px] leading-[22px] text-aura-muted">Memuat riwayat kuis…</p>
    </div>
  );
}

function PanelGagal({ pesan, onCobaLagi }: { pesan?: string; onCobaLagi: () => void }) {
  return (
    <div className="aura-glass flex flex-col items-start gap-3 rounded-[24px] p-5">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-aura-red/10 text-aura-red">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h3 className="font-display text-[16px] leading-[24px] font-semibold text-aura-ink">
          Riwayat kuis belum berhasil dimuat
        </h3>
        {pesan && <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">{pesan}</p>}
      </div>
      <button type="button" onClick={onCobaLagi} className="aura-btn aura-btn-secondary h-11 px-4 text-[13px]">
        Coba lagi
      </button>
    </div>
  );
}

function PanelKosong() {
  return (
    <div className="aura-glass flex flex-col items-center gap-3 rounded-[24px] p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
        <Inbox aria-hidden="true" className="size-6" />
      </span>
      <div>
        <h3 className="font-display text-[16px] leading-[24px] font-semibold text-aura-ink">Belum ada kuis</h3>
        <p className="mt-1 max-w-sm font-body text-[13px] leading-[20px] text-aura-muted">
          Tekan Buat kuis baru untuk membuat soal dan membuka kuis.
        </p>
      </div>
    </div>
  );
}
