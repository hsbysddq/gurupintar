'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Trash2 } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';
import { TombolSalinKode } from '@/components/TombolSalinKode';
import { ErrorApi, hapusKelas, ubahKelas } from '@/lib/api-klien';
import type { KelasRingkas } from '@/lib/tipe';

export function FormPengaturanKelas({ kelas }: { kelas: KelasRingkas }) {
  const router = useRouter();
  const [nama, setNama] = useState(kelas.nama);
  const [mapel, setMapel] = useState(kelas.mapel);
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [konfirmasiArsip, setKonfirmasiArsip] = useState(false);
  const [mengarsipkan, setMengarsipkan] = useState(false);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState<string | null>(null);

  useEffect(() => {
    if (!tersimpan) return;
    const waktu = setTimeout(() => setTersimpan(false), 2500);
    return () => clearTimeout(waktu);
  }, [tersimpan]);

  const berubah = nama.trim() !== kelas.nama || mapel.trim() !== kelas.mapel;

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setMenyimpan(true);
    setGalat(null);
    try {
      await ubahKelas({ id: kelas.id, nama, mapel });
      setTersimpan(true);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Perubahan belum tersimpan. Coba lagi sebentar.');
    } finally {
      setMenyimpan(false);
    }
  }

  async function arsipkan() {
    setMengarsipkan(true);
    setGalat(null);
    try {
      await ubahKelas({ id: kelas.id, arsip: true });
      router.push('/guru');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil diarsipkan. Coba lagi sebentar.');
      setMengarsipkan(false);
    }
  }

  async function hapus() {
    setMenghapus(true);
    setGalatHapus(null);
    try {
      await hapusKelas(kelas.id);
      router.push('/guru');
      router.refresh();
    } catch (err) {
      setGalatHapus(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil dihapus. Coba lagi sebentar.');
      setMenghapus(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <KartuKaca as="section" className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl leading-snug font-semibold">Identitas kelas</h2>
          <p className="text-tinta-lembut">Nama dan mata pelajaran tampil di daftar kelas.</p>
        </div>

        <form onSubmit={simpan} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="pengaturan-nama" className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Nama kelas
            </label>
            <input
              id="pengaturan-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pengaturan-mapel" className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Mata pelajaran
            </label>
            <input
              id="pengaturan-mapel"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              required
              className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta"
            />
          </div>
          <Tombol
            varian="utama"
            type="submit"
            memuat={menyimpan}
            disabled={!berubah || !nama.trim() || !mapel.trim()}
          >
            Simpan
          </Tombol>
        </form>

        {tersimpan && (
          <p role="status" className="font-medium text-sudah-teks">
            Perubahan tersimpan.
          </p>
        )}
        {galat && (
          <p role="alert" className="font-medium text-belum-teks">
            {galat}
          </p>
        )}
      </KartuKaca>

      <KartuKaca as="section" className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl leading-snug font-semibold">Kode undangan</h2>
          <p className="text-tinta-lembut">Bagikan kode ini agar siswa bisa mendaftar ke kelas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-kecil bg-tinta/5 px-4 py-2 text-2xl font-bold tracking-[0.25em]">
            {kelas.kodeUndangan}
          </span>
          <TombolSalinKode kode={kelas.kodeUndangan} />
        </div>
      </KartuKaca>

      <KartuKaca as="section" className="flex flex-col gap-3 border border-belum-teks/20 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-xl leading-snug font-semibold">
            <Archive aria-hidden="true" className="size-5 text-tinta-lembut" />
            Arsipkan kelas
          </h2>
          <p className="text-tinta-lembut">
            Kelas akan disembunyikan dari daftar. Data siswa, kuis, dan materi tetap tersimpan. Kuis yang sedang aktif
            akan ditutup.
          </p>
        </div>

        {!konfirmasiArsip ? (
          <div>
            <Tombol varian="sekunder" onClick={() => setKonfirmasiArsip(true)}>
              Arsipkan kelas
            </Tombol>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Tombol varian="utama" memuat={mengarsipkan} onClick={arsipkan}>
              Ya, arsipkan
            </Tombol>
            <Tombol varian="teks" disabled={mengarsipkan} onClick={() => setKonfirmasiArsip(false)}>
              Batal
            </Tombol>
          </div>
        )}
      </KartuKaca>

      <KartuKaca as="section" className="flex flex-col gap-3 border border-belum-teks/20 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-xl leading-snug font-semibold text-belum-teks">
            <Trash2 aria-hidden="true" className="size-5" />
            Hapus kelas
          </h2>
          <p className="text-tinta-lembut">
            Kelas dihapus permanen beserta daftar siswa, kuis, jawaban, hasil, dan materinya. Tindakan ini tidak bisa
            dibatalkan. Kalau hanya ingin menyembunyikan kelas, pakai Arsipkan kelas.
          </p>
        </div>

        {!konfirmasiHapus ? (
          <div>
            <Tombol varian="sekunder" onClick={() => setKonfirmasiHapus(true)}>
              Hapus kelas
            </Tombol>
          </div>
        ) : (
          <div role="alertdialog" aria-label={`Hapus ${kelas.nama}`} className="flex flex-col gap-3 rounded-kecil bg-belum-latar p-4">
            <p className="font-medium text-belum-teks">
              Hapus {kelas.nama} ({kelas.mapel}) dengan {kelas.jumlahSiswa} siswa? Semua datanya hilang dan tidak bisa
              dikembalikan.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Tombol varian="utama" memuat={menghapus} onClick={hapus}>
                Ya, hapus kelas
              </Tombol>
              <Tombol varian="teks" disabled={menghapus} onClick={() => setKonfirmasiHapus(false)}>
                Batal
              </Tombol>
            </div>
            {galatHapus && (
              <p role="alert" className="font-medium text-belum-teks">
                {galatHapus}
              </p>
            )}
          </div>
        )}
      </KartuKaca>
    </div>
  );
}
