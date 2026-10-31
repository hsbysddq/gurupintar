'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { useSiswa } from '@/components/PenyediaSiswa';
import { PilihanFormat } from '@/components/PilihanFormat';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { useSesiAktif } from '@/hooks/use-sesi-aktif';
import { ErrorApi, kirimFormat } from '@/lib/api-klien';
import { simpanFormatLokal } from '@/lib/sesi-lokal';
import type { Format } from '@/lib/tipe';

export default function HalamanPilihFormat() {
  const router = useRouter();
  const profil = useSiswa();
  const sesi = useSesiAktif();
  const [pilihan, setPilihan] = useState<Format | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  // Belum memilih kuis → kembali ke halaman kode.
  useEffect(() => {
    if (sesi === null) router.replace('/siswa/gabung');
  }, [sesi, router]);

  if (!sesi) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat halaman" />
      </KerangkaSiswa>
    );
  }

  const nilai = pilihan ?? sesi.format;

  async function lanjut() {
    if (!nilai) return;
    setMemuat(true);
    setGalat(null);
    try {
      await kirimFormat(sesi!.sesiId, nilai);
      simpanFormatLokal(nilai);
      router.push('/siswa/kuis');
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <KerangkaSiswa
      aksi={
        <>
          {galat && (
            <p role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
              {galat}
            </p>
          )}
          <Tombol varian="utama" ukuran="besar" lebarPenuh disabled={!nilai} memuat={memuat} onClick={lanjut}>
            Lanjut
          </Tombol>
        </>
      }
    >
      <header className="flex flex-col gap-1.5">
        <span className="aura-eyebrow">Ruang siswa</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink md:text-[32px]">
          Kamu lebih suka belajar lewat apa?
        </h1>
        <p className="text-aura-muted">Halo, {profil.nama}. Pilih bentuk materi yang paling nyaman untukmu.</p>
      </header>
      <PilihanFormat nilai={nilai} onPilih={setPilihan} />
      <p className="text-[13px] leading-normal text-aura-muted">Kamu bisa ganti kapan saja.</p>
    </KerangkaSiswa>
  );
}
