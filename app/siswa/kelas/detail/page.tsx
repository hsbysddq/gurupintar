'use client';

import { Suspense, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { usePolling } from '@/hooks/use-polling';
import { ambilDetailKelasSiswa } from '@/lib/api-klien';
import { INTERVAL_POLLING_SISWA_MS } from '@/lib/konstanta';
import type { StatusMateriSiswa } from '@/lib/tipe';

const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function labelMateri(status: StatusMateriSiswa): string {
  if (status === 'tersedia') return 'Materi sudah dibagikan.';
  if (status === 'disiapkan') return 'Materi sedang disiapkan gurumu.';
  return 'Kamu belum mengerjakan kuis ini.';
}

export default function HalamanDetailKelasSiswa() {
  return (
    <Suspense
      fallback={
        <KerangkaSiswa>
          <StatusHalaman jenis="memuat" judul="Memuat kelas" />
        </KerangkaSiswa>
      }
    >
      <IsiDetailKelas />
    </Suspense>
  );
}

function IsiDetailKelas() {
  const router = useRouter();
  const params = useSearchParams();
  const kelasId = params.get('kelas');

  useEffect(() => {
    if (!kelasId) router.replace('/siswa/kelas');
  }, [kelasId, router]);

  const ambil = useCallback(
    (signal: AbortSignal) => ambilDetailKelasSiswa(kelasId ?? '', signal),
    [kelasId],
  );
  const { data, galat, memuat, muatUlang } = usePolling(
    kelasId ? ambil : null,
    INTERVAL_POLLING_SISWA_MS,
  );

  if (!kelasId || memuat) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat kelas" />
      </KerangkaSiswa>
    );
  }

  if (!data) {
    return (
      <KerangkaSiswa>
        <StatusHalaman
          jenis="gagal"
          judul="Kelas belum berhasil dimuat"
          pesan={galat ?? 'Periksa koneksi, lalu coba lagi.'}
          aksi={{ label: 'Coba lagi', onClick: muatUlang }}
        />
      </KerangkaSiswa>
    );
  }

  const { kelas, sesi } = data;

  return (
    <KerangkaSiswa>
      <div>
        <Link
          href="/siswa/kelas"
          className="inline-flex min-h-10 items-center gap-1.5 text-[13px] leading-normal font-semibold text-tinta-lembut hover:text-primer"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kelas saya
        </Link>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">{kelas.nama}</h1>
        <p className="text-tinta-lembut">
          {kelas.mapel} · {kelas.namaGuru}
        </p>
      </header>

      {kelas.kuisAktif && (
        <KartuKaca as="section" className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="flex items-center gap-2 text-lg leading-snug font-semibold">
                <PlayCircle aria-hidden="true" className="size-5 text-primer" />
                Kuis aktif
              </h2>
              <p className="text-tinta-lembut">
                Kode kuis <strong className="tracking-wide text-tinta">{kelas.kuisAktif.kodeKelas}</strong>
              </p>
            </div>
          </div>
          <div>
            <Tombol varian="utama" href={`/siswa?kode=${kelas.kuisAktif.kodeKelas}`}>
              Kerjakan kuis
            </Tombol>
          </div>
        </KartuKaca>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl leading-snug font-semibold">Riwayat kuis</h2>
        {sesi.length === 0 ? (
          <KartuKaca as="div" className="p-5">
            <p className="text-tinta-lembut">Belum ada kuis di kelas ini.</p>
          </KartuKaca>
        ) : (
          <ul className="flex flex-col gap-3">
            {sesi.map((s) => (
              <li key={s.id}>
                <KartuKaca as="article" className="flex flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[12px] leading-normal font-medium text-tinta-lembut">
                        {FORMAT_TANGGAL.format(new Date(s.dibuatPada))} · Kode {s.kodeKelas}
                      </p>
                      <h3 className="text-lg leading-snug font-semibold">{s.namaTopik}</h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[12px] leading-normal font-semibold ${
                        s.status === 'aktif' ? 'bg-primer-lembut text-primer' : 'bg-tinta/5 text-tinta-lembut'
                      }`}
                    >
                      {s.status === 'aktif' ? 'Aktif' : 'Selesai'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[14px] leading-normal text-tinta-lembut">{labelMateri(s.statusMateri)}</p>
                    {s.statusMateri === 'tersedia' && (
                      <Tombol varian="utama" href={`/siswa/materi?sesi=${s.id}`}>
                        Lihat materi
                      </Tombol>
                    )}
                    {s.statusMateri === 'belum-mengerjakan' && s.status === 'aktif' && (
                      <Tombol varian="sekunder" href={`/siswa?kode=${s.kodeKelas}`}>
                        Kerjakan kuis
                      </Tombol>
                    )}
                  </div>
                </KartuKaca>
              </li>
            ))}
          </ul>
        )}
      </section>
    </KerangkaSiswa>
  );
}
