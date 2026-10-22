'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hourglass } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { TabMateriSiswa } from '@/components/TabMateriSiswa';
import { Tombol } from '@/components/Tombol';
import { useSesiAktif } from '@/hooks/use-sesi-aktif';
import { usePolling } from '@/hooks/use-polling';
import { ambilMateriSiswa } from '@/lib/api-klien';
import { INTERVAL_POLLING_SISWA_MS } from '@/lib/konstanta';

// PRD F-7. Tidak ada label kelompok di halaman ini (D-2).
export default function HalamanMateriSiswa() {
  return (
    <Suspense
      fallback={
        <KerangkaSiswa>
          <StatusHalaman jenis="memuat" judul="Memuat materimu" />
        </KerangkaSiswa>
      }
    >
      <IsiMateriSiswa />
    </Suspense>
  );
}

function IsiMateriSiswa() {
  const router = useRouter();
  const params = useSearchParams();
  const sesiDariUrl = params.get('sesi');
  const sesi = useSesiAktif();
  const sesiId = sesiDariUrl ?? sesi?.sesiId;
  const dariRiwayat = Boolean(sesiDariUrl) && sesiDariUrl !== sesi?.sesiId;

  // Tanpa sesi aktif dan tanpa ?sesi=, kembali ke daftar kelas.
  useEffect(() => {
    if (sesi === null && !sesiDariUrl) router.replace('/siswa/kelas');
  }, [sesi, sesiDariUrl, router]);

  // Polling terus berjalan agar materi muncul otomatis setelah dibagikan (AC-7.1).
  const ambil = useCallback((signal: AbortSignal) => ambilMateriSiswa(sesiId ?? '', signal), [sesiId]);
  const { data, galat, memuat, muatUlang } = usePolling(sesiId ? ambil : null, INTERVAL_POLLING_SISWA_MS);

  if (!sesiId || memuat) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat materimu" />
      </KerangkaSiswa>
    );
  }

  if (!data) {
    return (
      <KerangkaSiswa>
        <StatusHalaman
          jenis="gagal"
          judul="Materi belum berhasil dimuat"
          pesan={galat ?? 'Periksa koneksi, lalu coba lagi.'}
          aksi={{ label: 'Coba lagi', onClick: muatUlang }}
        />
      </KerangkaSiswa>
    );
  }

  const aksiKembali = (
    <Tombol varian="sekunder" ukuran="besar" lebarPenuh href="/siswa/kelas">
      Kembali ke kelas
    </Tombol>
  );

  if (data.status === 'belum-mengerjakan') {
    return (
      <KerangkaSiswa
        aksi={
          dariRiwayat ? (
            aksiKembali
          ) : (
            <Tombol varian="utama" ukuran="besar" lebarPenuh href="/siswa/kuis">
              Kerjakan kuis
            </Tombol>
          )
        }
      >
        <KartuKaca as="section" className="flex flex-col gap-2 p-6">
          <h1 className="text-[28px] leading-tight font-bold">Kamu belum mengerjakan kuis ini.</h1>
          <p className="text-tinta-lembut">Kerjakan kuisnya dulu, ya. Setelah itu gurumu akan membagikan materi untukmu.</p>
        </KartuKaca>
      </KerangkaSiswa>
    );
  }

  if (data.status === 'disiapkan') {
    return (
      <KerangkaSiswa aksi={dariRiwayat ? aksiKembali : undefined}>
        <KartuKaca as="section" className="flex flex-col items-center gap-4 p-8 text-center">
          <Hourglass aria-hidden="true" className="size-12 text-primer" />
          <h1 role="status" aria-live="polite" className="text-[28px] leading-tight font-bold">
            Materimu sedang disiapkan gurumu.
          </h1>
          <p className="text-tinta-lembut">Halaman ini akan diperbarui sendiri. Kamu tidak perlu memuat ulang.</p>
        </KartuKaca>
      </KerangkaSiswa>
    );
  }

  return (
    <KerangkaSiswa aksi={dariRiwayat ? aksiKembali : undefined}>
      <h1 className="text-[28px] leading-tight font-bold">Materi untukmu: {data.namaTopik}</h1>
      <TabMateriSiswa isi={data.isi} formatAwal={data.format} />
    </KerangkaSiswa>
  );
}
