'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, gabungKelas } from '@/lib/api-klien';
import { normalisasiKode } from '@/lib/skema-api';

/** Form gabung ke kelas lewat kode undangan dari guru (POST /api/siswa/kelas). */
export function FormGabungMapel() {
  const router = useRouter();
  const [kode, setKode] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [berhasil, setBerhasil] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    setBerhasil(null);
    try {
      const { kelas } = await gabungKelas(kode);
      setBerhasil(`Kamu bergabung ke ${kelas.mapel} (${kelas.nama}).`);
      setKode('');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-3" noValidate>
      <div className="relative">
        <label htmlFor="kode-undangan" className="sr-only">
          Kode undangan kelas
        </label>
        <input
          id="kode-undangan"
          name="kode"
          value={kode}
          onChange={(e) => setKode(normalisasiKode(e.target.value))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          placeholder="Contoh: 4GSBM"
          aria-invalid={galat ? true : undefined}
          aria-describedby={galat ? 'galat-gabung-mapel' : undefined}
          className="h-12 w-full rounded-xl border border-aura-outline/60 bg-white/70 pr-11 pl-4 text-[15px] font-semibold tracking-[0.15em] text-aura-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-aura-muted/70"
        />
        <KeyRound
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-aura-muted"
        />
      </div>
      {galat && (
        <p id="galat-gabung-mapel" role="alert" className="text-[13px] leading-normal text-belum-teks">
          {galat}
        </p>
      )}
      {berhasil && (
        <p role="status" className="text-[13px] leading-normal text-sudah-teks">
          {berhasil}
        </p>
      )}
      <Tombol varian="utama" type="submit" lebarPenuh memuat={memuat} disabled={kode.length === 0}>
        Gabung Kelas
      </Tombol>
    </form>
  );
}
