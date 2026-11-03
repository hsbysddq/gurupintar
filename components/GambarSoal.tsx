'use client';

import { useState } from 'react';
import GambarNext from 'next/image';
import { Maximize2, X } from 'lucide-react';

export function GambarSoal({
  src,
  alt,
  ringkas = false,
}: {
  src: string;
  alt: string;
  ringkas?: boolean;
}) {
  const [diperbesar, setDiperbesar] = useState(false);

  return (
    <>
      <div className="relative flex w-fit max-w-full flex-col items-start gap-2">
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white p-2 shadow-sm">
          <GambarNext
            src={src}
            alt={alt}
            width={640}
            height={420}
            unoptimized
            className={`w-auto max-w-full rounded-xl object-contain ${ringkas ? 'max-h-48' : 'max-h-72'}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setDiperbesar(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 font-display text-[11px] font-semibold text-aura-muted transition-colors hover:bg-white hover:text-aura-primary"
        >
          <Maximize2 aria-hidden="true" className="size-3.5" />
          Perbesar gambar
        </button>
      </div>

      {diperbesar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setDiperbesar(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90dvh] max-w-4xl flex-col items-end gap-2 rounded-3xl bg-white p-3 shadow-2xl sm:p-4"
          >
            <button
              type="button"
              onClick={() => setDiperbesar(false)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 font-display text-[12px] font-bold text-slate-700 hover:bg-slate-200"
            >
              <X aria-hidden="true" className="size-4" />
              Tutup
            </button>
            <GambarNext
              src={src}
              alt={alt}
              width={1000}
              height={800}
              unoptimized
              className="max-h-[78dvh] w-auto max-w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

