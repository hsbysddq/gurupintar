'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { BingkaiAuth, KELAS_INPUT_AUTH, KolomAuth } from '@/components/BingkaiAuth';
import { Tombol } from '@/components/Tombol';
import { daftarSuperAdmin, ErrorApi } from '@/lib/api-klien';

export default function HalamanDaftarSuperAdmin() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kode, setKode] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const hasil = await daftarSuperAdmin({ nama, email, password, kodeUndangan: kode });
      router.replace(hasil.perluMasuk ? '/masuk' : '/super-admin');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <BingkaiAuth
      judul="Daftar super-admin"
      keterangan="Halaman ini hanya untuk pengelola platform. Kamu memerlukan kode undangan dari pemilik sistem."
      footer={
        <span>
          Sudah punya akses?{' '}
          <Link href="/masuk" className="font-semibold text-primer hover:underline">
            Masuk
          </Link>
        </span>
      }
    >
      <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
        <KolomAuth id="nama" label="Nama lengkap">
          <input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" required className={KELAS_INPUT_AUTH} />
        </KolomAuth>
        <KolomAuth id="email" label="Email">
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={KELAS_INPUT_AUTH} />
        </KolomAuth>
        <KolomAuth id="password" label="Kata sandi" petunjuk="Minimal 8 karakter.">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>
        <KolomAuth id="kode" label="Kode undangan super-admin">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tinta-lembut" />
            <input
              id="kode"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              autoComplete="off"
              required
              className={`${KELAS_INPUT_AUTH} pl-9`}
            />
          </div>
        </KolomAuth>
        {galat && <p role="alert" className="font-medium text-belum-teks">{galat}</p>}
        <Tombol
          varian="utama"
          ukuran="besar"
          type="submit"
          lebarPenuh
          memuat={memuat}
          ikon={ShieldCheck}
          disabled={!nama || !email || password.length < 8 || !kode}
        >
          Buat akun super-admin
        </Tombol>
      </form>
      <p className="inline-flex items-start gap-2 rounded-kecil bg-primer-lembut/50 p-3 text-[12px] leading-[18px] text-tinta-lembut">
        <UserPlus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primer" />
        Jangan bagikan kode undangan. Setelah punya akun super-admin, sekolah dan admin sekolah dibuat dari dasbor super-admin.
      </p>
    </BingkaiAuth>
  );
}
