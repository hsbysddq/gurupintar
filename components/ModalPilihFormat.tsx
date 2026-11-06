'use client';

import { useEffect, useRef } from 'react';
import { Check, FileText, Headphones, PlayCircle, Presentation, X, type LucideIcon } from 'lucide-react';
import type { FormatMateri } from '@/lib/tipe';

const PILIHAN: { format: FormatMateri; label: string; deskripsi: string; ikon: LucideIcon }[] = [
  { format: 'video', label: 'Video', deskripsi: 'Naskah video dengan alur visual.', ikon: PlayCircle },
  { format: 'audio', label: 'Audio', deskripsi: 'Cerita audio dengan gaya pilihan.', ikon: Headphones },
  { format: 'bacaan', label: 'Bacaan', deskripsi: 'E-book bertingkat dengan bab dan poin penting.', ikon: FileText },
  { format: 'ppt', label: 'PPT', deskripsi: 'Slide presentasi siap dipakai.', ikon: Presentation },
];

export function ModalPilihFormat({
  terbuka,
  nilai,
  onPilih,
  onTutup,
}: {
  terbuka: boolean;
  nilai: FormatMateri | '';
  onPilih: (format: FormatMateri) => void;
  onTutup: () => void;
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
        aria-label="Tutup pilihan format"
        onClick={onTutup}
        className="absolute inset-0 bg-aura-ink/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-format-hasil"
        className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-white/70 bg-[#FFFDF9] shadow-[0_32px_90px_-24px_rgba(15,23,42,0.5)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-aura-ink/10 p-5">
          <div>
            <h2 id="judul-format-hasil" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
              Pilih format hasil
            </h2>
            <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
              Satu generate menghasilkan satu format. Pilih yang paling kamu butuhkan.
            </p>
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

        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {PILIHAN.map(({ format, label, deskripsi, ikon: Ikon }) => {
            const dipilih = nilai === format;
            return (
              <button
                key={format}
                type="button"
                aria-pressed={dipilih}
                onClick={() => onPilih(format)}
                className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                  dipilih
                    ? 'border-aura-primary/40 bg-aura-primary/[0.07]'
                    : 'border-aura-ink/10 bg-white/75 hover:border-aura-primary/25 hover:bg-white'
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    dipilih ? 'bg-aura-primary text-white' : 'bg-aura-primary/10 text-aura-primary'
                  }`}
                >
                  <Ikon aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-[13px] leading-[18px] font-bold text-aura-ink">{label}</span>
                    {dipilih && <Check aria-hidden="true" className="size-4 shrink-0 text-aura-primary" />}
                  </span>
                  <span className="mt-0.5 block font-body text-[10px] leading-[15px] text-aura-muted">{deskripsi}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
