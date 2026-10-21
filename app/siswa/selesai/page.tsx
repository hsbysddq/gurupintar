'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { useSesiAktif } from '@/hooks/use-sesi-aktif';

// AC-3.6: tanpa nilai dan tanpa kelompok.
export default function HalamanSelesai() {
  const router = useRouter();
  const sesi = useSesiAktif();

  useEffect(() => {
    if (sesi === null) router.replace('/siswa');
  }, [sesi, router]);

  if (!sesi) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat halaman" />
      </KerangkaSiswa>
    );
  }

  return (
    <KerangkaSiswa
      aksi={
        <Tombol varian="utama" ukuran="besar" lebarPenuh href="/siswa/materi">
          Lihat materi
        </Tombol>
      }
    >
      <KartuKaca as="section" className="flex flex-col items-center gap-4 p-8 text-center">
        <CircleCheck aria-hidden="true" className="size-12 text-sudah-teks" />
        <h1 className="text-[28px] leading-tight font-bold">Jawabanmu sudah terkirim.</h1>
        <p className="text-tinta-lembut">Tunggu gurumu membagikan materi untukmu.</p>
      </KartuKaca>
    </KerangkaSiswa>
  );
}
