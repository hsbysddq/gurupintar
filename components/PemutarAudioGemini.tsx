'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, X } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { buatAudioMateri } from '@/lib/api-klien';
import type { GayaAudio } from '@/lib/tipe';

type StatusAudio = 'memuat' | 'siap' | 'gagal';

type PemutarAudioGeminiProps = {
  teks: string;
  gaya: GayaAudio;
  /** Diisi hanya di halaman siswa; server memakai naskah dari materi, bukan teks dari browser. */
  sesiId?: string;
};

export function PemutarAudioGemini({ teks, gaya, sesiId }: PemutarAudioGeminiProps) {
  const [status, setStatus] = useState<StatusAudio>('memuat');
  const [url, setUrl] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(true);
  const [sedangMain, setSedangMain] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let aktif = true;
    buatAudioMateri(sesiId ? { sumber: 'siswa', sesi: sesiId } : { sumber: 'guru', teks, gaya })
      .then((hasil) => {
        if (!aktif) return;
        setUrl(hasil.url);
        setStatus('siap');
        setModalTerbuka(false);
      })
      .catch((err: unknown) => {
        if (!aktif) return;
        setGalat(err instanceof Error ? err.message : 'Suara natural belum berhasil dibuat.');
        setStatus('gagal');
        setModalTerbuka(false);
      });
    return () => {
      aktif = false;
    };
  }, [gaya, sesiId, teks]);

  async function coba() {
    setStatus('memuat');
    setGalat(null);
    setModalTerbuka(true);
    try {
      const hasil = await buatAudioMateri(
        sesiId ? { sumber: 'siswa', sesi: sesiId } : { sumber: 'guru', teks, gaya },
      );
      setUrl(hasil.url);
      setStatus('siap');
      setModalTerbuka(false);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Suara natural belum berhasil dibuat.');
      setStatus('gagal');
      setModalTerbuka(false);
    }
  }

  async function putar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (sedangMain) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      setGalat('Audio belum bisa diputar. Coba lagi sebentar.');
      setStatus('gagal');
    }
  }

  return (
    <>
      {status === 'memuat' && modalTerbuka && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div aria-hidden="true" className="absolute inset-0 bg-aura-ink/45 backdrop-blur-[2px]" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-proses-audio"
            className="relative w-full max-w-sm rounded-[24px] border border-white/70 bg-[#FFFDF9] p-5 shadow-[0_32px_90px_-24px_rgba(15,23,42,0.5)]"
          >
            <button
              type="button"
              onClick={() => setModalTerbuka(false)}
              aria-label="Tutup pemberitahuan"
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </span>
            <h3 id="judul-proses-audio" className="mt-3 font-display text-[18px] leading-[26px] font-bold text-aura-ink">
              Audio sedang dibuat
            </h3>
            <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">
              Naskah sedang diubah menjadi suara natural. Proses ini bisa 1–2 menit. Kamu bisa menutup pemberitahuan ini
              dan tetap membaca transkrip di bawah.
            </p>
            <button
              type="button"
              onClick={() => setModalTerbuka(false)}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-aura-primary px-4 font-display text-[12px] font-bold text-white transition-colors hover:brightness-105"
            >
              Tutup, lanjut baca
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {status === 'memuat' && !modalTerbuka && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-aura-primary/10 bg-aura-primary/[0.04] px-3 py-2.5">
            <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-aura-primary" />
            <p className="font-body text-[12px] leading-[18px] text-aura-muted">Sedang membuat audio natural…</p>
          </div>
        )}

        {status === 'siap' && url && (
          <>
            <audio
              ref={audioRef}
              src={url}
              preload="auto"
              className="hidden"
              onPlay={() => setSedangMain(true)}
              onPause={() => setSedangMain(false)}
              onEnded={() => setSedangMain(false)}
              onError={() => {
                setGalat('Audio belum bisa diputar. Coba lagi sebentar.');
                setStatus('gagal');
              }}
            />
            <Tombol
              varian="utama"
              ukuran="besar"
              lebarPenuh
              ikon={sedangMain ? Pause : Play}
              onClick={() => void putar()}
            >
              {sedangMain ? 'Jeda audio' : 'Putar audio'}
            </Tombol>
            <p className="font-body text-[11px] leading-[16px] text-aura-muted">
              Suara AI sudah siap dan disimpan untuk materi ini.
            </p>
          </>
        )}

        {status === 'gagal' && (
          <>
            <p role="alert" className="font-body text-[12px] leading-[18px] text-aura-red">
              {galat ?? 'Suara natural belum berhasil dibuat.'}
            </p>
            <Tombol varian="sekunder" ukuran="besar" lebarPenuh onClick={() => void coba()}>
              Coba buat audio lagi
            </Tombol>
          </>
        )}
      </div>
    </>
  );
}
