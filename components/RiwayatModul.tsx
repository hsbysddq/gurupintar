'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  Headphones,
  History,
  Loader2,
  PlayCircle,
  Presentation,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { ambilDetailRiwayatModul, ambilRiwayatModul, hapusRiwayatModul } from '@/lib/api-klien';
import { ambilGayaAudio } from '@/lib/gaya-audio';
import { ambilGayaPpt } from '@/lib/gaya-ppt';
import type { FormatMateri, RiwayatModulDetail, RiwayatModulRingkas } from '@/lib/tipe';

const FORMAT_WAKTU = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const FORMAT: Record<FormatMateri, { label: string; ikon: LucideIcon; kelas: string }> = {
  video: { label: 'Video', ikon: PlayCircle, kelas: 'bg-aura-primary/10 text-aura-primary' },
  audio: { label: 'Audio', ikon: Headphones, kelas: 'bg-aura-violet/10 text-aura-violet' },
  bacaan: { label: 'Bacaan', ikon: FileText, kelas: 'bg-aura-emerald/10 text-[#047857]' },
  ppt: { label: 'PPT', ikon: Presentation, kelas: 'bg-aura-amber/10 text-[#92400e]' },
};

function labelGaya(item: RiwayatModulRingkas): string | null {
  if (item.format === 'audio' && item.gayaAudio) return ambilGayaAudio(item.gayaAudio).nama;
  if (item.format === 'ppt' && item.gayaPpt) return ambilGayaPpt(item.gayaPpt).nama;
  return null;
}

export function RiwayatModul({
  segarkan = 0,
  onBuka,
}: {
  segarkan?: number;
  onBuka: (detail: RiwayatModulDetail) => void;
}) {
  const [daftar, setDaftar] = useState<RiwayatModulRingkas[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [membukaId, setMembukaId] = useState<string | null>(null);
  const [menghapusId, setMenghapusId] = useState<string | null>(null);

  const muat = useCallback(async () => {
    try {
      setDaftar(await ambilRiwayatModul());
      setGalat(null);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Riwayat Ubah Modul belum bisa dimuat.');
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    let aktif = true;
    ambilRiwayatModul()
      .then((data) => {
        if (!aktif) return;
        setDaftar(data);
        setGalat(null);
      })
      .catch((err: unknown) => {
        if (!aktif) return;
        setGalat(err instanceof Error ? err.message : 'Riwayat Ubah Modul belum bisa dimuat.');
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, [segarkan]);

  function muatUlang() {
    setMemuat(true);
    setGalat(null);
    void muat();
  }

  async function buka(id: string) {
    if (membukaId) return;
    setMembukaId(id);
    setGalat(null);
    try {
      onBuka(await ambilDetailRiwayatModul(id));
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Riwayat belum bisa dibuka.');
    } finally {
      setMembukaId(null);
    }
  }

  async function hapus(id: string) {
    if (menghapusId) return;
    if (!window.confirm('Hapus riwayat ini? Materi yang sudah disimpan ke kelas tidak ikut terhapus.')) return;
    setMenghapusId(id);
    setGalat(null);
    try {
      await hapusRiwayatModul(id);
      setDaftar((sebelumnya) => sebelumnya.filter((item) => item.id !== id));
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Riwayat belum bisa dihapus.');
    } finally {
      setMenghapusId(null);
    }
  }

  return (
    <section aria-labelledby="judul-riwayat-modul" className="aura-glass rounded-[24px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
            <History aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="judul-riwayat-modul" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
              Riwayat Ubah Modul
            </h2>
            <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
              Pembuatan terakhir tersimpan otomatis. Buka lagi untuk memeriksa atau menyimpannya ke kelas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={muatUlang}
          disabled={memuat}
          className="aura-btn aura-btn-secondary h-10 px-3 text-[12px] disabled:opacity-60"
        >
          {memuat ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-3.5" />
          )}
          Muat ulang
        </button>
      </div>

      {galat && (
        <p role="alert" className="mt-4 rounded-xl border border-aura-amber/20 bg-aura-amber/10 px-3 py-2 font-body text-[12px] leading-[18px] text-[#92400e]">
          {galat}
        </p>
      )}

      {memuat && daftar.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/70 bg-white/45 px-4 py-5">
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-aura-primary" />
          <p className="font-body text-[12px] leading-[18px] text-aura-muted">Memuat riwayat Ubah Modul…</p>
        </div>
      ) : daftar.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-aura-ink/10 bg-white/35 px-4 py-8 text-center">
          <History aria-hidden="true" className="size-5 text-aura-muted" />
          <p className="mt-2 font-body text-[12px] leading-[18px] text-aura-muted">
            Belum ada riwayat. Setiap generate Ubah Modul yang berhasil akan muncul di sini.
          </p>
        </div>
      ) : (
        <ul className="mt-4 max-h-[360px] divide-y divide-aura-ink/5 overflow-y-auto pr-1">
          {daftar.map((item) => {
            const info = FORMAT[item.format] ?? FORMAT.bacaan;
            const Ikon = info.ikon;
            const gaya = labelGaya(item);
            return (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${info.kelas}`}>
                  <Ikon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[12px] leading-[18px] font-semibold text-aura-ink">
                    {item.judul}
                  </p>
                  <p className="truncate font-body text-[11px] leading-[16px] text-aura-muted">
                    {info.label}
                    {gaya ? ` · ${gaya}` : ''} · {FORMAT_WAKTU.format(new Date(item.dibuatPada))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void buka(item.id)}
                    disabled={membukaId !== null || menghapusId !== null}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl px-2.5 font-display text-[11px] font-bold text-aura-primary transition-colors hover:bg-aura-primary/10 disabled:opacity-50"
                  >
                    {membukaId === item.id ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : 'Buka'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void hapus(item.id)}
                    disabled={membukaId !== null || menghapusId !== null}
                    aria-label={`Hapus riwayat ${item.judul}`}
                    className="flex size-9 items-center justify-center rounded-xl text-aura-muted transition-colors hover:bg-aura-red/10 hover:text-aura-red disabled:opacity-50"
                  >
                    {menghapusId === item.id ? (
                      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
