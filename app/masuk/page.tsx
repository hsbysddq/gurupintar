'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BingkaiAuth, KELAS_INPUT_AUTH, KolomAuth } from '@/components/BingkaiAuth';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, masuk } from '@/lib/api-klien';
import { lanjutAman } from '@/lib/auth';

export default function HalamanMasuk() {
  return (
    <Suspense fallback={<StatusHalaman jenis="memuat" judul="Memuat halaman masuk" />}>
      <FormMasuk />
    </Suspense>
  );
}

function FormMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const hasil = await masuk({ email, password });
      router.replace(lanjutAman(params.get('lanjut'), hasil.peran));
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <BingkaiAuth
      judul="Masuk ke Guru Pintar"
      keterangan="Gunakan akun yang diberikan gurumu atau yang kamu daftarkan sendiri."
      footer={
        <p className="flex flex-col gap-1">
          <span>
            Belum punya akun siswa?{' '}
            <Link href="/daftar/siswa" className="font-semibold text-primer hover:underline">
              Daftar siswa
            </Link>
          </span>
          <span className="text-[13px]">
            Guru baru?{' '}
            <Link href="/daftar/guru" className="font-semibold text-primer hover:underline">
              Daftar guru
            </Link>
          </span>
        </p>
      }
    >
      <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
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
        <KolomAuth id="password" label="Kata sandi">
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>

        {galat && (
          <p role="alert" className="font-medium text-belum-teks">
            {galat}
          </p>
        )}

        <Tombol varian="utama" ukuran="besar" type="submit" lebarPenuh memuat={memuat} disabled={!email || !password}>
          Masuk
        </Tombol>
      </form>
    </BingkaiAuth>
  );
}
