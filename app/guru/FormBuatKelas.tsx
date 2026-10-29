'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, School } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { buatKelas, ErrorApi } from '@/lib/api-klien';

export function FormBuatKelas({ pertamaKali = false }: { pertamaKali?: boolean }) {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [mapel, setMapel] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const baru = await buatKelas({ nama, mapel });
      router.push(`/guru/kelas?kelas=${baru.id}`);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil dibuat. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <section className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aura-primary via-aura-violet to-aura-emerald"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-aura-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-aura-primary">
            <span className="flex size-7 items-center justify-center rounded-lg bg-aura-primary/10 ring-1 ring-white/70">
              <School aria-hidden="true" className="size-3.5" />
            </span>
            Kelas baru
          </span>
          <h2 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
            {pertamaKali ? 'Buat kelas pertamamu' : 'Buat kelas baru'}
          </h2>
          <p className="font-body text-[13px] leading-[20px] text-aura-muted">
            Siswa mendaftar dengan kode undangan kelas. Setiap kelas punya kuis dan materinya sendiri.
          </p>
        </div>

        <form onSubmit={kirim} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kelas-baru-nama"
              className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted"
            >
              Nama kelas
            </label>
            <input
              id="kelas-baru-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Kelas 7B"
              required
              className="h-12 rounded-2xl border border-white/70 bg-white/65 px-3.5 font-body text-base text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kelas-baru-mapel"
              className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted"
            >
              Mata pelajaran
            </label>
            <input
              id="kelas-baru-mapel"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              placeholder="Biologi"
              required
              className="h-12 rounded-2xl border border-white/70 bg-white/65 px-3.5 font-body text-base text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85"
            />
          </div>
          <Tombol varian="utama" type="submit" ikon={Plus} memuat={memuat} disabled={!nama.trim() || !mapel.trim()}>
            Buat kelas
          </Tombol>
        </form>

        {galat && (
          <p role="alert" className="font-body text-[13px] leading-[20px] font-medium text-[#93000a]">
            {galat}
          </p>
        )}
      </div>
    </section>
  );
}
