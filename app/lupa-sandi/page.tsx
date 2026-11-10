'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Send } from 'lucide-react';
import { BingkaiAuth, KELAS_INPUT_AUTH, KolomAuth } from '@/components/BingkaiAuth';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, kirimKodeResetSandi } from '@/lib/api-klien';

export default function HalamanLupaSandi() {
  const [email, setEmail] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setGalat('Email wajib diisi.');
      return;
    }
    setMemuat(true);
    setGalat(null);
    try {
      await kirimKodeResetSandi({ email: email.trim() });
      setTerkirim(true);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
    } finally {
      setMemuat(false);
    }
  }

  if (terkirim) {
    return (
      <BingkaiAuth
        judul="Cek emailmu"
        keterangan="Kami sudah mengirim kode 6 digit jika email itu terdaftar."
        footer={
          <span>
            Ingat kata sandi?{' '}
            <Link href="/masuk" className="font-semibold text-primer hover:underline">
              Masuk
            </Link>
          </span>
        }
      >
        <div role="status" className="flex flex-col gap-4 rounded-kecil border border-sudah-teks/20 bg-sudah-latar p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-sudah-teks">
              <Mail aria-hidden="true" className="size-4" />
            </span>
            <p className="text-[14px] leading-[22px] text-sudah-teks">
              Kode dikirim ke <strong>{email}</strong>. Cek inbox atau folder spam. Kode berlaku 24 jam. Jika belum
              masuk, tunggu beberapa saat lalu coba lagi.
            </p>
          </div>
          <Tombol varian="utama" lebarPenuh href={`/atur-sandi?email=${encodeURIComponent(email)}`}>
            Masukkan kode dan kata sandi baru
          </Tombol>
        </div>

        <button
          type="button"
          onClick={() => setTerkirim(false)}
          className="min-h-11 self-start text-[13px] font-semibold text-aura-primary hover:underline"
        >
          Pakai email lain
        </button>
      </BingkaiAuth>
    );
  }

  return (
    <BingkaiAuth
      judul="Lupa kata sandi"
      keterangan="Masukkan email akun guru atau siswa. Kami akan mengirim kode 6 digit untuk membuat kata sandi baru."
      footer={
        <span>
          Ingat kata sandi?{' '}
          <Link href="/masuk" className="font-semibold text-primer hover:underline">
            Masuk
          </Link>
        </span>
      }
    >
      <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
        <KolomAuth id="email" label="Email terdaftar">
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (galat) setGalat(null);
            }}
            autoComplete="email"
            required
            autoFocus
            className={KELAS_INPUT_AUTH}
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
          disabled={!email.trim()}
          ikon={Send}
        >
          Kirim kode
        </Tombol>
      </form>

      <p className="text-[12px] leading-[18px] text-tinta-lembut">
        Demi keamanan, kami tidak memberi tahu apakah sebuah email terdaftar. Jika tidak menerima kode, periksa
        ejaan email atau hubungi guru/admin sekolah.
      </p>
    </BingkaiAuth>
  );
}
