'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BingkaiAuth, KELAS_INPUT_AUTH, KolomAuth } from '@/components/BingkaiAuth';
import { Tombol } from '@/components/Tombol';
import { daftarGuru, ErrorApi } from '@/lib/api-klien';

export default function HalamanDaftarGuru() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kodeUndangan, setKodeUndangan] = useState('');
  const [namaKelas, setNamaKelas] = useState('');
  const [mapel, setMapel] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const hasil = await daftarGuru({
        nama,
        email,
        password,
        kodeUndangan,
        namaKelas: namaKelas || undefined,
        mapel: mapel || undefined,
      });
      router.replace(hasil.perluMasuk ? '/masuk' : '/guru');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <BingkaiAuth
      judul="Daftar sebagai guru"
      keterangan="Pendaftaran guru memerlukan kode undangan dari pengelola sekolah."
      footer={
        <span>
          Sudah punya akun?{' '}
          <Link href="/masuk" className="font-semibold text-primer hover:underline">
            Masuk
          </Link>
        </span>
      }
    >
      <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
        <KolomAuth id="nama" label="Nama lengkap">
          <input
            id="nama"
            name="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="name"
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>
        <KolomAuth id="email" label="Email">
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>
        <KolomAuth id="password" label="Kata sandi" petunjuk="Minimal 8 karakter.">
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>
        <KolomAuth id="kode-undangan" label="Kode undangan guru">
          <input
            id="kode-undangan"
            name="kode-undangan"
            value={kodeUndangan}
            onChange={(e) => setKodeUndangan(e.target.value)}
            autoComplete="off"
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>
        <div className="grid gap-4 sm:grid-cols-2">
          <KolomAuth id="nama-kelas" label="Nama kelas (opsional)">
            <input
              id="nama-kelas"
              name="nama-kelas"
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
              placeholder="Kelas 7A"
              className={KELAS_INPUT_AUTH}
            />
          </KolomAuth>
          <KolomAuth id="mapel" label="Mata pelajaran (opsional)">
            <input
              id="mapel"
              name="mapel"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              placeholder="Matematika"
              className={KELAS_INPUT_AUTH}
            />
          </KolomAuth>
        </div>

        {galat && (
          <p role="alert" className="font-medium text-belum-teks">
            {galat}
          </p>
        )}

        <Tombol
          varian="utama"
          ukuran="besar"
          type="submit"
          lebarPenuh
          memuat={memuat}
          disabled={!nama || !email || password.length < 8 || !kodeUndangan}
        >
          Buat akun guru
        </Tombol>
      </form>
    </BingkaiAuth>
  );
}
