'use client';

import { useState } from 'react';
import GambarNext from 'next/image';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { kompresGambarSoal } from '@/lib/kompres-gambar';

export function UnggahGambarSoal({
  idInput,
  nomorSoal,
  gambar,
  galat,
  onUbah,
}: {
  idInput: string;
  nomorSoal: number;
  gambar: string;
  galat?: string;
  onUbah: (gambarBaru: string) => void;
}) {
  const [memproses, setMemproses] = useState(false);
  const [galatLokal, setGalatLokal] = useState<string | null>(null);

  async function pilihFile(file: File | null) {
    if (!file) return;
    setMemproses(true);
    setGalatLokal(null);
    try {
      const hasil = await kompresGambarSoal(file);
      onUbah(hasil);
    } catch (err) {
      setGalatLokal(err instanceof Error ? err.message : 'Gambar belum berhasil diproses.');
    } finally {
      setMemproses(false);
    }
  }

  const pesanGalat = galat ?? galatLokal;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-aura-primary/25 bg-white/45 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
            Gambar soal <span className="font-body font-medium normal-case">(opsional)</span>
          </span>
          <span className="font-body text-[12px] leading-[18px] text-aura-muted">
            Tambahkan ilustrasi seperti bangun datar segitiga, grafik, tabel, atau diagram (JPEG/PNG/WebP).
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id={idInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={memproses}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = '';
              void pilihFile(file);
            }}
            className="peer sr-only"
          />
          <label
            htmlFor={idInput}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-aura-primary/25 bg-white/80 px-3.5 font-display text-[12px] font-semibold text-aura-primary shadow-sm transition-colors hover:bg-white peer-disabled:cursor-wait peer-disabled:opacity-60"
          >
            {memproses ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-3.5" />
            )}
            {memproses ? 'Memproses…' : gambar ? 'Ganti gambar' : 'Unggah gambar'}
          </label>

          {gambar && (
            <button
              type="button"
              onClick={() => {
                setGalatLokal(null);
                onUbah('');
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-aura-red/20 bg-aura-red/5 px-3 font-display text-[12px] font-semibold text-[#93000a] transition-colors hover:bg-aura-red/10"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Hapus
            </button>
          )}
        </div>
      </div>

      {gambar && (
        <div className="mt-1 w-fit max-w-full overflow-hidden rounded-xl border border-white/80 bg-white p-2 shadow-sm">
          <GambarNext
            src={gambar}
            alt={`Gambar soal ${nomorSoal}`}
            width={480}
            height={320}
            unoptimized
            className="max-h-56 w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      )}

      {pesanGalat && (
        <p id={`${idInput}-galat`} className="font-body text-[12px] leading-[18px] font-medium text-[#93000a]">
          {pesanGalat}
        </p>
      )}
    </div>
  );
}

