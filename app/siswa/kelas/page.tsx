'use client';

import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { PlayCircle, School } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { useSiswa } from '@/components/PenyediaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { usePolling } from '@/hooks/use-polling';
import { ambilKelasSiswa, ErrorApi, gabungKelas } from '@/lib/api-klien';
import { INTERVAL_POLLING_SISWA_MS } from '@/lib/konstanta';
import { normalisasiKode } from '@/lib/skema-api';

export default function HalamanKelasSiswa() {
  const profil = useSiswa();
  const ambil = useCallback((signal: AbortSignal) => ambilKelasSiswa(signal), []);
  const { data: daftar, galat, memuat, muatUlang } = usePolling(ambil, INTERVAL_POLLING_SISWA_MS);

  const [kode, setKode] = useState('');
  const [menggabung, setMenggabung] = useState(false);
  const [galatGabung, setGalatGabung] = useState<string | null>(null);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);

  async function gabung(e: FormEvent) {
    e.preventDefault();
    setMenggabung(true);
    setGalatGabung(null);
    setPesanSukses(null);
    try {
      const hasil = await gabungKelas(kode);
      setKode('');
      setPesanSukses(`Berhasil bergabung ke ${hasil.kelas.nama}.`);
      muatUlang();
    } catch (err) {
      setGalatGabung(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil digabung. Coba lagi sebentar.');
    } finally {
      setMenggabung(false);
    }
  }

  return (
    <KerangkaSiswa>
      <header className="flex flex-col gap-2">
        <p className="text-[13px] leading-normal font-medium text-primer">Halo, {profil.nama}</p>
        <h1 className="text-[28px] leading-tight font-bold">Kelas saya</h1>
        <p className="text-tinta-lembut">Kelas yang kamu ikuti dan kuis yang sedang aktif.</p>
      </header>

      <KartuKaca as="section" className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-lg leading-snug font-semibold">
            <School aria-hidden="true" className="size-5 text-primer" />
            Gabung kelas baru
          </h2>
          <p className="text-tinta-lembut">
            Masukkan kode undangan kelas dari gurumu. Kode ini berbeda dari kode kuis.
          </p>
        </div>

        <form onSubmit={gabung} className="flex flex-col gap-2 sm:flex-row" noValidate>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="kode-kelas" className="sr-only">
              Kode undangan kelas
            </label>
            <input
              id="kode-kelas"
              value={kode}
              onChange={(e) => setKode(normalisasiKode(e.target.value))}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={6}
              placeholder="KEL7A"
              className="kaca h-12 rounded-tombol px-4 text-xl font-bold tracking-[0.25em] placeholder:text-tinta-lembut/50"
            />
          </div>
          <Tombol varian="utama" type="submit" memuat={menggabung} disabled={!kode}>
            Gabung
          </Tombol>
        </form>

        {galatGabung && (
          <p role="alert" className="font-medium text-belum-teks">
            {galatGabung}
          </p>
        )}
        {pesanSukses && (
          <p role="status" className="font-medium text-sudah-teks">
            {pesanSukses}
          </p>
        )}
      </KartuKaca>

      {memuat && <StatusHalaman jenis="memuat" judul="Memuat kelasmu" />}
      {!memuat && !daftar && (
        <StatusHalaman
          jenis="gagal"
          judul="Kelas belum berhasil dimuat"
          pesan={galat ?? 'Periksa koneksi, lalu coba lagi.'}
          aksi={{ label: 'Coba lagi', onClick: muatUlang }}
        />
      )}
      {!memuat && daftar && daftar.length === 0 && (
        <KartuKaca as="section" className="flex flex-col gap-2 p-5">
          <h2 className="text-lg leading-snug font-semibold">Belum tergabung di kelas mana pun</h2>
          <p className="text-tinta-lembut">Minta kode undangan kelas kepada gurumu, lalu masukkan di atas.</p>
        </KartuKaca>
      )}

      {!memuat && daftar && daftar.length > 0 && (
        <ul className="flex flex-col gap-3">
          {daftar.map((kelas) => (
            <li key={kelas.id}>
              <KartuKaca as="article" className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl leading-snug font-semibold">{kelas.nama}</h2>
                    <p className="text-tinta-lembut">
                      {kelas.mapel} · {kelas.namaGuru}
                    </p>
                  </div>
                  {kelas.kuisAktif ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primer-lembut px-2.5 py-1 text-[12px] leading-normal font-semibold text-primer">
                      <PlayCircle aria-hidden="true" className="size-3.5" />
                      Kuis aktif
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-tinta/5 px-2.5 py-1 text-[12px] leading-normal font-semibold text-tinta-lembut">
                      Belum ada kuis
                    </span>
                  )}
                </div>

                {kelas.kuisAktif ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[14px] leading-normal text-tinta-lembut">
                      Kode kuis <strong className="tracking-wide text-tinta">{kelas.kuisAktif.kodeKelas}</strong>
                    </p>
                    <Tombol varian="utama" href={`/siswa/gabung?kode=${kelas.kuisAktif.kodeKelas}`}>
                      Kerjakan kuis
                    </Tombol>
                  </div>
                ) : (
                  <p className="text-[14px] leading-normal text-tinta-lembut">
                    Belum ada kuis aktif. Materi akan muncul setelah gurumu membagikannya.
                  </p>
                )}

                <Link
                  href={`/siswa/kelas/detail?kelas=${kelas.id}`}
                  className="text-[14px] leading-normal font-semibold text-primer hover:underline"
                >
                  Lihat semua kuis & materi →
                </Link>
              </KartuKaca>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-tinta-lembut">
        Punya kode kuis?{' '}
        <Link href="/siswa/gabung" className="font-semibold text-primer hover:underline">
          Gabung kuis
        </Link>
      </p>
    </KerangkaSiswa>
  );
}
