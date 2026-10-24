'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { useSesiAktif } from '@/hooks/use-sesi-aktif';

type Hasil = { skor: number; total: number };

// Skor boleh tampil ke siswa; label kelompok tetap tidak pernah ditampilkan (D-2).
function bacaHasil(sesiId: string): Hasil | null {
  try {
    const mentah = sessionStorage.getItem('gp-hasil-kuis');
    if (!mentah) return null;
    const data = JSON.parse(mentah) as { sesiId?: string; skor?: number; total?: number };
    if (data.sesiId !== sesiId || typeof data.skor !== 'number' || typeof data.total !== 'number') return null;
    return { skor: data.skor, total: data.total };
  } catch {
    return null;
  }
}

export default function HalamanSelesai() {
  const router = useRouter();
  const sesi = useSesiAktif();
  // `sesi` baru terisi setelah hidrasi (undefined di server), jadi sessionStorage aman dibaca di sini.
  const sesiId = sesi?.sesiId;
  const hasil = useMemo(() => (sesiId ? bacaHasil(sesiId) : null), [sesiId]);

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

  const persen = hasil && hasil.total > 0 ? Math.round((hasil.skor / hasil.total) * 100) : 0;

  return (
    <KerangkaSiswa
      aksi={
        <>
          <Tombol varian="utama" ukuran="besar" lebarPenuh href="/siswa/materi">
            Lihat materi
          </Tombol>
          <Tombol varian="sekunder" ukuran="besar" lebarPenuh href="/siswa/performa">
            Lihat performa dan riwayat
          </Tombol>
        </>
      }
    >
      <KartuKaca as="section" className="flex flex-col items-center gap-4 p-8 text-center">
        <CircleCheck aria-hidden="true" className="size-12 text-sudah-teks" />
        <h1 className="text-[28px] leading-tight font-bold">Jawabanmu sudah terkirim.</h1>

        {hasil && (
          <div className="flex w-full flex-col gap-4">
            <div>
              <div className="mb-1 flex justify-between text-sm font-semibold text-tinta-lembut">
                <span>Akurasi</span>
                <span>{persen}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Akurasi jawaban"
                aria-valuenow={persen}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-3 w-full overflow-hidden rounded-full bg-red-200"
              >
                <div className="h-full rounded-full bg-green-600" style={{ width: `${persen}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-3xl font-bold text-green-700">{hasil.skor}</p>
                <p className="text-sm text-tinta-lembut">Benar</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-3xl font-bold text-red-700">{hasil.total - hasil.skor}</p>
                <p className="text-sm text-tinta-lembut">Salah</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-tinta-lembut">Tunggu gurumu membagikan materi untukmu.</p>
      </KartuKaca>
    </KerangkaSiswa>
  );
}
