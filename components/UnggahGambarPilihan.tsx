'use client';

import { useState } from 'react';
import GambarNext from 'next/image';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { kompresGambarSoal } from '@/lib/kompres-gambar';

export function UnggahGambarPilihan({
  idInput,
  kode,
  gambar,
  memproses = false,
  galat,
  onUbah,
}: {
  idInput: string;
  kode: string;
  gambar: string;
  memproses?: boolean;
  galat?: string;
  onUbah: (gambarBaru: string) => void;
}) {
  const [memprosesLokal, setMemprosesLokal] = useState(false);
  const [galatLokal, setGalatLokal] = useState<string | null>(null);
  const sedang = memproses || memprosesLokal;
  const pesanGalat = galat ?? galatLokal;

  async function pilihFile(file: File | null) {
    if (!file) return;
    setMemprosesLokal(true);
    setGalatLokal(null);
    try {
      onUbah(await kompresGambarSoal(file));
    } catch (err) {
      setGalatLokal(err instanceof Error ? err.message : 'Gambar pilihan belum berhasil diproses.');
    } finally {
      setMemprosesLokal(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={idInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={sedang}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = '';
            void pilihFile(file);
          }}
          className="peer sr-only"
        />
        <label
          htmlFor={idInput}
          className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-aura-primary/20 bg-white/70 px-2.5 font-display text-[10px] font-semibold text-aura-primary transition-colors hover:bg-white peer-disabled:cursor-wait peer-disabled:opacity-60"
        >
          {sedang ? (
            <Loader2 aria-hidden="true" className="size-3 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="size-3" />
          )}
          {sedang ? 'Memproses…' : gambar ? 'Ganti gambar' : 'Gambar pilihan'}
        </label>
        <span className="font-body text-[10px] leading-[14px] text-aura-muted">Ctrl+V untuk tempel</span>
        {gambar && (
          <button
            type="button"
            onClick={() => onUbah('')}
            disabled={sedang}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-aura-red/20 bg-aura-red/5 px-2.5 font-display text-[10px] font-semibold text-[#93000a] hover:bg-aura-red/10 disabled:cursor-wait disabled:opacity-60"
          >
            <Trash2 aria-hidden="true" className="size-3" />
            Hapus
          </button>
        )}
      </div>

      {gambar && (
        <div className="w-fit max-w-full overflow-hidden rounded-lg border border-white/80 bg-white p-1.5 shadow-sm">
          <GambarNext
            src={gambar}
            alt={`Gambar pilihan ${kode}`}
            width={320}
            height={200}
            unoptimized
            className="max-h-24 w-auto max-w-full rounded object-contain"
          />
        </div>
      )}

      {pesanGalat && (
        <p role="alert" className="font-body text-[10px] leading-[14px] font-medium text-[#93000a]">
          {pesanGalat}
        </p>
      )}
    </div>
  );
}
