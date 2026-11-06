'use client';

import { useEffect, useRef } from 'react';
import { BookOpen, Check, Headphones, Loader2, MessagesSquare, Mic, Sparkles, X, type LucideIcon } from 'lucide-react';
import { DAFTAR_GAYA_AUDIO } from '@/lib/gaya-audio';
import type { GayaAudio } from '@/lib/tipe';

const IKON: Record<GayaAudio, LucideIcon> = {
  docu: Mic,
  podcast: Headphones,
  dialog: MessagesSquare,
  cerita: BookOpen,
};

const TINGGI_GELOMBANG = [8, 14, 10, 18, 12, 16, 9, 15, 11];

export function ModalGayaAudio({
  terbuka,
  nilai,
  memuat,
  onPilih,
  onTutup,
  onBuat,
}: {
  terbuka: boolean;
  nilai: GayaAudio;
  memuat: boolean;
  onPilih: (gaya: GayaAudio) => void;
  onTutup: () => void;
  onBuat: () => void;
}) {
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
        aria-label="Tutup pilihan gaya audio"
        onClick={onTutup}
        className="absolute inset-0 bg-aura-ink/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-gaya-audio"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/70 bg-[#FFFDF9] shadow-[0_32px_90px_-24px_rgba(15,23,42,0.5)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-aura-ink/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
              <Headphones aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="judul-gaya-audio" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
                Pilih gaya audio
              </h2>
              <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
                Gaya ini mengubah cara bercerita, bukan isi materi. Bisa dipilih ulang kapan saja.
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
            {DAFTAR_GAYA_AUDIO.map((gaya) => {
              const dipilih = nilai === gaya.id;
              const Ikon = IKON[gaya.id];
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
                  <div className="relative overflow-hidden rounded-xl border border-aura-primary/10 bg-gradient-to-br from-aura-primary/[0.09] via-white to-aura-primary/[0.03] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-white/85 text-aura-primary ring-1 ring-aura-primary/10">
                        <Ikon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="rounded-full bg-white/80 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.04em] text-aura-muted ring-1 ring-aura-ink/5">
                          {gaya.suara}
                        </span>
                        {dipilih && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-aura-primary text-white">
                            <Check aria-hidden="true" className="size-3" />
                          </span>
                        )}
                      </span>
                    </div>
                    <div aria-hidden="true" className="mt-3 flex h-5 items-end gap-1">
                      {TINGGI_GELOMBANG.map((tinggi, i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full ${dipilih ? 'bg-aura-primary/70' : 'bg-aura-primary/25'}`}
                          style={{ height: `${tinggi}px` }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 line-clamp-2 font-body text-[10px] leading-[15px] text-aura-muted italic">
                      “{gaya.contoh}”
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="font-display text-[12px] leading-[18px] font-bold text-aura-ink">
                      {gaya.kode} — {gaya.nama}
                    </p>
                    <p className="mt-0.5 font-body text-[10px] leading-[15px] text-aura-muted">{gaya.deskripsi}</p>
                    <p className="mt-1 font-body text-[10px] leading-[15px] text-aura-primary/80">{gaya.cocok}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-aura-primary/10 bg-aura-primary/[0.04] p-3">
            <p className="font-body text-[11px] leading-[17px] text-aura-muted">
              Naskah akan ditulis ulang sebagai cerita—bukan pembacaan teks modul. Untuk gaya Docu Vlog, adegan bersifat
              ilustratif dan tidak mengaku sebagai liputan nyata.
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
            Buat audio
          </button>
        </div>
      </div>
    </div>
  );
}
