'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, School } from 'lucide-react';

export type KelasPilihan = { id: string; nama: string; mapel: string };

/** Pemilih kelas aktif di sidebar siswa. Dipisah agar useSearchParams punya batas Suspense sendiri. */
export function PemilihKelasSiswa({ kelas }: { kelas: KelasPilihan[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const kelasAktif = params.get('kelas') ?? '';
  const terpilih = kelas.find((k) => k.id === kelasAktif) ?? null;

  function pilih(id: string) {
    // Filter kelas berlaku di beranda, jadi dari halaman mana pun pemilih ini membuka beranda.
    router.push(id ? `/siswa?kelas=${encodeURIComponent(id)}` : '/siswa');
  }

  return (
    <div className="hidden flex-col gap-1.5 xl:flex">
      <div className="flex items-center justify-between gap-2 px-1">
        <label
          htmlFor="pilih-kelas-siswa"
          className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
        >
          Kelas aktif
        </label>
        <span className="font-body text-[11px] leading-[16px] text-aura-muted">{kelas.length} kelas</span>
      </div>

      <div className="relative rounded-2xl border border-aura-primary/15 bg-gradient-to-br from-aura-primary/10 to-aura-violet/10 shadow-[0_4px_16px_-4px_rgba(37,99,235,0.12)] transition-colors hover:border-aura-primary/30 focus-within:ring-[3px] focus-within:ring-aura-primary/30">
        <div aria-hidden="true" className="pointer-events-none flex items-center gap-3 p-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-aura-primary shadow-sm ring-1 ring-aura-primary/10">
            <School className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[14px] leading-[20px] font-bold text-aura-ink">
              {terpilih ? `${terpilih.mapel} · ${terpilih.nama}` : 'Semua kelas'}
            </p>
            <p className="font-body text-[11px] leading-[16px] font-medium text-aura-muted">
              {terpilih ? 'Kelas aktif saat ini' : `${kelas.length} kelas terdaftar`}
            </p>
          </div>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-aura-muted" />
        </div>
        <select
          id="pilih-kelas-siswa"
          value={terpilih ? kelasAktif : ''}
          onChange={(e) => pilih(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
        >
          <option value="">Semua kelas</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.mapel} · {k.nama}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
