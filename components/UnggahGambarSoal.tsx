'use client';

import { useState } from 'react';
import GambarNext from 'next/image';
import { ClipboardPaste, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { kompresGambarSoal } from '@/lib/kompres-gambar';

export function UnggahGambarSoal({
  idInput,
  nomorSoal,
  gambar,
  galat,
  memprosesTempel = false,
  galatTempel,
  onUbah,
}: {
  idInput: string;
  nomorSoal: number;
  gambar: string;
  galat?: string;
  memprosesTempel?: boolean;
  galatTempel?: string;
  onUbah: (gambarBaru: string) => void;
}) {
  const [memproses, setMemproses] = useState(false);
  const [membacaClipboard, setMembacaClipboard] = useState(false);
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

  async function tempelGambar() {
    setGalatLokal(null);
    if (!navigator.clipboard?.read) {
      setGalatLokal('Browser ini belum mendukung tempel gambar. Klik kanan gambar → Copy image, lalu gunakan Ctrl+V di tombol Tempel gambar.');
      return;
    }

    setMembacaClipboard(true);
    try {
      const daftar = await navigator.clipboard.read();
      for (const item of daftar) {
        const tipe = item.types.find((jenis) => /^image\/(jpeg|png|webp)$/i.test(jenis));
        if (!tipe) continue;
        const blob = await item.getType(tipe);
        const ekstensi = tipe === 'image/jpeg' ? 'jpg' : tipe.split('/')[1];
        await pilihFile(new File([blob], `tempel.${ekstensi}`, { type: tipe }));
        return;
      }
      setGalatLokal('Clipboard tidak berisi gambar. Klik kanan gambar di Google → Copy image, lalu coba lagi.');
    } catch {
      setGalatLokal('Akses clipboard ditolak. Klik tombol Tempel gambar lagi, atau tekan Ctrl+V saat tombol ini aktif.');
    } finally {
      setMembacaClipboard(false);
    }
  }

  const sedangMemproses = memproses || membacaClipboard || memprosesTempel;
  const pesanGalat = galat ?? galatTempel ?? galatLokal;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-aura-primary/25 bg-white/45 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
            Gambar soal <span className="font-body font-medium normal-case">(opsional)</span>
          </span>
          <span className="font-body text-[12px] leading-[18px] text-aura-muted">
            Unggah file, atau copy gambar dari Google lalu tekan Ctrl+V di kolom soal. Bisa juga klik Tempel gambar.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id={idInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={sedangMemproses}
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
            {sedangMemproses ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-3.5" />
            )}
            {memprosesTempel
              ? 'Menempel…'
              : memproses
                ? 'Memproses…'
                : gambar
                  ? 'Ganti gambar'
                  : 'Unggah gambar'}
          </label>

          <button
            type="button"
            onClick={() => void tempelGambar()}
            disabled={sedangMemproses}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-aura-primary/20 bg-aura-primary/5 px-3.5 font-display text-[12px] font-semibold text-aura-primary transition-colors hover:bg-aura-primary/10 disabled:cursor-wait disabled:opacity-60"
          >
            {sedangMemproses ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <ClipboardPaste aria-hidden="true" className="size-3.5" />
            )}
            {memprosesTempel ? 'Menempel…' : membacaClipboard ? 'Membaca clipboard…' : 'Tempel gambar'}
          </button>

          {gambar && (
            <button
              type="button"
              onClick={() => {
                setGalatLokal(null);
                onUbah('');
              }}
              disabled={sedangMemproses}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-aura-red/20 bg-aura-red/5 px-3 font-display text-[12px] font-semibold text-[#93000a] transition-colors hover:bg-aura-red/10 disabled:cursor-wait disabled:opacity-60"
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

