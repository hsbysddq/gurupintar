'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { normalisasiKode } from '@/lib/skema-api';

/**
 * Masuk ke kuis lewat kode kuis dari guru. Hanya membuka /siswa/gabung dengan kode terisi;
 * pengecekan kode dan keanggotaan kelas tetap dilakukan di server oleh halaman itu.
 */
export function FormGabungKuis() {
  const router = useRouter();
  const [kode, setKode] = useState('');

  function kirim(e: FormEvent) {
    e.preventDefault();
    if (kode.length === 0) return;
    router.push(`/siswa/gabung?kode=${encodeURIComponent(kode)}`);
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-3" noValidate>
      <div className="relative">
        <label htmlFor="kode-kuis-beranda" className="sr-only">
          Kode kuis
        </label>
        <input
          id="kode-kuis-beranda"
          name="kode"
          value={kode}
          onChange={(e) => setKode(normalisasiKode(e.target.value))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          placeholder="Contoh: A7K2P"
          className="h-12 w-full rounded-xl border border-aura-outline/60 bg-white/70 pr-11 pl-4 text-[15px] font-semibold tracking-[0.15em] text-aura-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-aura-muted/70"
        />
        <KeyRound
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-aura-muted"
        />
      </div>
      <Tombol varian="utama" type="submit" lebarPenuh disabled={kode.length === 0}>
        Masuk ke kuis
      </Tombol>
    </form>
  );
}
