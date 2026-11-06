'use client';

import { useEffect, useRef } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { DAFTAR_GAYA_PPT, hexCss } from '@/lib/gaya-ppt';
import type { GayaPpt } from '@/lib/tipe';

export function ModalGayaPpt({
  terbuka,
  nilai,
  memuat,
  onPilih,
  onTutup,
  onBuat,
}: {
  terbuka: boolean;
  nilai: GayaPpt;
  memuat: boolean;
  onPilih: (gaya: GayaPpt) => void;
  onTutup: () => void;
  onBuat: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const tutupRef = useRef<HTMLButtonElement>(null);
  const onTutupRef = useRef(onTutup);

  useEffect(() => {
    onTutupRef.current = onTutup;
  }, [onTutup]);

  useEffect(() => {
    if (!terbuka) return;
    tutupRef.current?.focus();
    function tekan(event: KeyboardEvent) {
      if (event.key === 'Escape') onTutupRef.current();
    }
    window.addEventListener('keydown', tekan);
    return () => window.removeEventListener('keydown', tekan);
  }, [terbuka]);

  if (!terbuka) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup pilihan gaya"
        onClick={onTutup}
        className="absolute inset-0 bg-aura-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-gaya-ppt"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/70 bg-[#FFFDF9] shadow-[0_32px_90px_-24px_rgba(15,23,42,0.5)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-aura-ink/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="judul-gaya-ppt" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
                Pilih gaya PPT
              </h2>
              <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
                Gaya ini menentukan tipografi, warna, dan komposisi slide. Bisa dipilih ulang kapan saja.
              </p>
            </div>
          </div>
          <button
            ref={tutupRef}
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {DAFTAR_GAYA_PPT.map((gaya) => {
              const dipilih = nilai === gaya.id;
              return (
                <button
                  key={gaya.id}
                  type="button"
                  aria-pressed={dipilih}
                  onClick={() => onPilih(gaya.id)}
                  className={`group flex flex-col gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    dipilih
                      ? 'border-aura-primary/45 bg-white ring-1 ring-aura-primary/25'
                      : 'border-aura-ink/10 bg-white/65 hover:border-aura-primary/25 hover:bg-white'
                  }`}
                >
                  <div
                    className="relative aspect-[16/9] w-full overflow-hidden rounded-lg p-3"
                    style={{
                      backgroundColor: hexCss(gaya.latar),
                      color: hexCss(gaya.teks),
                      fontFamily: gaya.font,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[24px] leading-none font-bold" style={{ color: hexCss(gaya.aksen) }}>
                        01
                      </span>
                      {dipilih && (
                        <span
                          className="flex size-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: hexCss(gaya.aksen), color: hexCss(gaya.aksenTeks) }}
                        >
                          <Check aria-hidden="true" className="size-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] leading-tight font-bold">
                      Judul{' '}
                      <span
                        style={{
                          backgroundColor: hexCss(gaya.aksen),
                          color: hexCss(gaya.aksenTeks),
                          padding: '0 3px',
                        }}
                      >
                        utama
                      </span>
                    </p>
                    <div className="mt-2 h-0.5 w-8" style={{ backgroundColor: hexCss(gaya.aksen) }} />
                    <p className="mt-2 text-[7px] leading-tight opacity-70">Subjudul materi yang ringkas</p>
                    <span className="absolute bottom-2 right-3 text-[6px] opacity-60">01 / 06</span>
                  </div>

                  <div className="min-w-0">
                    <p className="font-display text-[12px] leading-[18px] font-bold text-aura-ink">
                      {gaya.kode} — {gaya.nama}
                    </p>
                    <p className="mt-0.5 font-body text-[10px] leading-[15px] text-aura-muted">{gaya.deskripsi}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-aura-primary/10 bg-aura-primary/[0.04] p-3">
            <p className="font-body text-[11px] leading-[17px] text-aura-muted">
              Struktur slide mengikuti gaya editorial: cover dengan angka besar, isi satu ide per slide, lalu penutup
              dengan CTA. Tanpa shadow atau gradient.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-aura-ink/10 bg-white/60 p-4">
          <button
            type="button"
            onClick={onTutup}
            className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 font-display text-[12px] font-semibold text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onBuat}
            disabled={memuat}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aura-primary to-aura-primary-deep px-4 font-display text-[12px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.65)] transition-all hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
          >
            {memuat ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
            Buat PPT
          </button>
        </div>
      </div>
    </div>
  );
}
