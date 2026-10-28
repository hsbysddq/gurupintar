'use client';

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { useSiswa } from '@/components/PenyediaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, gabungSesi } from '@/lib/api-klien';
import { simpanSesi } from '@/lib/sesi-lokal';
import { normalisasiKode } from '@/lib/skema-api';

// Kode kuis biasanya 5–6 karakter (skema kode kelas di server).
const MIN_PANJANG_KODE = 5;

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
  const kodeAwal = normalisasiKode(params.get("kode") ?? "");
  // Datang dari beranda atau kartu kuis dengan kode terisi: langsung diperiksa, siswa tidak perlu menekan Lanjut lagi.
  const langsung = kodeAwal.length >= MIN_PANJANG_KODE;
  const [kode, setKode] = useState(kodeAwal);
  const [memuat, setMemuat] = useState(langsung);
  const [galat, setGalat] = useState<string | null>(null);
  const sudahLangsung = useRef(false);

  async function masuk(kodeDipakai: string) {
    try {
      const { sesi } = await gabungSesi(kodeDipakai);
      simpanSesi({ sesiId: sesi.id, kodeKelas: sesi.kodeKelas, format: null, kelasId: sesi.kelasId });
      router.push('/siswa/format');
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  useEffect(() => {
    if (!langsung || sudahLangsung.current) return;
    sudahLangsung.current = true;
    void masuk(kodeAwal);
    // Hanya sekali saat halaman dibuka; kode salah tidak diulang otomatis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cariKelas(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    void masuk(kode);
  }

  return (
    <KerangkaSiswa>
      <header className="flex flex-col gap-2">
        <p className="text-[13px] leading-normal font-medium text-primer">Halo, {profil.nama}</p>
        <h1 className="text-[28px] leading-tight font-bold">Masukkan kode kuis</h1>
        <p className="text-tinta-lembut">Kode kuis ada di layar gurumu.</p>
      </header>

      <form onSubmit={cariKelas} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="kode" className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Kode kuis
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

      <Tombol varian="teks" lebarPenuh href="/siswa/performa">
        Lihat performa dan riwayatku
      </Tombol>
      <p className="text-center text-tinta-lembut">
        Sudah punya kelas?{' '}
        <Link href="/siswa/kelas" className="font-semibold text-primer hover:underline">
          Lihat kelas saya
        </Link>
      </p>
      <Tombol varian="teks" lebarPenuh href="/siswa">
        Kembali ke beranda
      </Tombol>
    </KerangkaSiswa>
  );
}
