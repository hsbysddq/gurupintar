'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BingkaiAuth, KELAS_INPUT_AUTH, KolomAuth } from '@/components/BingkaiAuth';
import { Tombol } from '@/components/Tombol';
import { daftarSiswa, ErrorApi } from '@/lib/api-klien';
import { normalisasiKode } from '@/lib/skema-api';

export default function HalamanDaftarSiswa() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kodeKelas, setKodeKelas] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const hasil = await daftarSiswa({ nama, email, password, kodeKelas: kodeKelas || undefined });
      router.replace(hasil.perluMasuk ? '/masuk' : '/siswa');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <BingkaiAuth
      judul="Daftar sebagai siswa"
      keterangan="Akunmu menyimpan jawaban dan materi. Kamu tetap memakai kode kuis dari gurumu."
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
        <KolomAuth id="kode-kelas" label="Kode kelas (opsional)" petunjuk="Kode undangan dari gurumu, misalnya KEL7A.">
          <input
            id="kode-kelas"
            name="kode-kelas"
            value={kodeKelas}
            onChange={(e) => setKodeKelas(normalisasiKode(e.target.value))}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={6}
            placeholder="KEL7A"
            className={`${KELAS_INPUT_AUTH} font-bold tracking-[0.2em] uppercase`}
          />
        </KolomAuth>

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
          disabled={!nama || !email || password.length < 8}
        >
          Buat akun siswa
        </Tombol>
      </form>
    </BingkaiAuth>
  );
}
