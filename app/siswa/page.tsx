'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { useSiswa } from '@/components/PenyediaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, gabungSesi } from '@/lib/api-klien';
import { simpanSesi } from '@/lib/sesi-lokal';
import { normalisasiKode } from '@/lib/skema-api';

export default function HalamanGabungKelas() {
  return (
    <Suspense
      fallback={
        <KerangkaSiswa>
          <StatusHalaman jenis="memuat" judul="Memuat halaman" />
        </KerangkaSiswa>
      }
    >
      <GabungKelas />
    </Suspense>
  );
}

function GabungKelas() {
  const router = useRouter();
  const params = useSearchParams();
  const profil = useSiswa();
  const [kode, setKode] = useState(() => normalisasiKode(params.get("kode") ?? ""));
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function cariKelas(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const { sesi } = await gabungSesi(kode);
      simpanSesi({ sesiId: sesi.id, kodeKelas: sesi.kodeKelas, format: null });
      router.push('/siswa/format');
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <KerangkaSiswa>
      <header className="flex flex-col gap-2">
        <p className="text-[13px] leading-normal font-medium text-primer">Halo, {profil.nama}</p>
        <h1 className="text-[28px] leading-tight font-bold">Masukkan kode kelas</h1>
        <p className="text-tinta-lembut">Kode kelas ada di layar gurumu.</p>
      </header>

      <form onSubmit={cariKelas} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="kode" className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Kode kelas
          </label>
          <input
            id="kode"
            name="kode"
            value={kode}
            onChange={(e) => setKode(normalisasiKode(e.target.value))}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={6}
            placeholder="A7K2P"
            aria-invalid={galat ? true : undefined}
            aria-describedby={galat ? 'galat-kode' : undefined}
            className="kaca h-13 rounded-tombol px-4 text-2xl font-bold tracking-[0.3em] placeholder:text-tinta-lembut/50"
          />
          {galat && (
            <p id="galat-kode" role="alert" className="text-belum-teks">
              {galat}
            </p>
          )}
        </div>
        <Tombol varian="utama" ukuran="besar" type="submit" lebarPenuh memuat={memuat} disabled={kode.length === 0}>
          Lanjut
        </Tombol>
      </form>
    </KerangkaSiswa>
  );
}
