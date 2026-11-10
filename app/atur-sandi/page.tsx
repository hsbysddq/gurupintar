'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { BingkaiAuth, KELAS_INPUT_AUTH, KolomAuth } from '@/components/BingkaiAuth';
import { Tombol } from '@/components/Tombol';
import { aturUlangSandi, ErrorApi } from '@/lib/api-klien';

export default function HalamanAturSandi() {
  return (
    <Suspense fallback={<FallbackAturSandi />}>
      <FormAturSandi />
    </Suspense>
  );
}

function FormAturSandi() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setGalat('Email wajib diisi.');
      return;
    }
    if (!/^\d{6}$/.test(token)) {
      setGalat('Kode harus terdiri dari 6 digit.');
      return;
    }
    if (password.length < 8) {
      setGalat('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== konfirmasi) {
      setGalat('Konfirmasi kata sandi belum sama.');
      return;
    }

    setMemuat(true);
    setGalat(null);
    try {
      await aturUlangSandi({ email: email.trim(), token, password });
      setSukses(true);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
    } finally {
      setMemuat(false);
    }
  }

  if (sukses) {
    return (
      <BingkaiAuth
        judul="Kata sandi berhasil diubah"
        keterangan="Semua sesi lama sudah dicabut. Masuk lagi dengan kata sandi baru."
        footer={
          <span>
            Kembali ke{' '}
            <Link href="/masuk" className="font-semibold text-primer hover:underline">
              halaman masuk
            </Link>
          </span>
        }
      >
        <div role="status" className="flex items-start gap-3 rounded-kecil border border-sudah-teks/20 bg-sudah-latar p-4">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-sudah-teks">
            <ShieldCheck aria-hidden="true" className="size-4" />
          </span>
          <p className="text-[14px] leading-[22px] text-sudah-teks">
            Kata sandi untuk <strong>{email}</strong> sudah diperbarui.
          </p>
        </div>
        <Tombol varian="utama" lebarPenuh href="/masuk?reset=1">
          Masuk sekarang
        </Tombol>
      </BingkaiAuth>
    );
  }

  return (
    <BingkaiAuth
      judul="Buat kata sandi baru"
      keterangan="Masukkan kode 6 digit dari email, lalu tentukan kata sandi baru untuk akunmu."
      footer={
        <span>
          Belum menerima kode?{' '}
          <Link href="/lupa-sandi" className="font-semibold text-primer hover:underline">
            Kirim ulang
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
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={KELAS_INPUT_AUTH}
          />
        </KolomAuth>

        <KolomAuth id="token" label="Kode dari email" petunjuk="Enam digit angka.">
          <input
            id="token"
            name="token"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className={`${KELAS_INPUT_AUTH} text-center font-display text-[22px] font-bold tracking-[0.3em]`}
          />
        </KolomAuth>

        <KolomAuth id="password" label="Kata sandi baru" petunjuk="Minimal 8 karakter.">
          <div className="relative">
            <input
              id="password"
              name="password"
              type={lihatSandi ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className={`${KELAS_INPUT_AUTH} pr-12`}
            />
            <button
              type="button"
              onClick={() => setLihatSandi((v) => !v)}
              aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-pressed={lihatSandi}
              className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-tinta-lembut transition-colors hover:bg-white/70 hover:text-primer"
            >
              {lihatSandi ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </KolomAuth>

        <KolomAuth id="konfirmasi" label="Ulangi kata sandi baru">
          <input
            id="konfirmasi"
            name="konfirmasi"
            type={lihatSandi ? 'text' : 'password'}
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
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
          disabled={!email.trim() || token.length !== 6 || password.length < 8 || konfirmasi.length < 8}
          ikon={KeyRound}
        >
          Simpan kata sandi
        </Tombol>
      </form>
    </BingkaiAuth>
  );
}

function FallbackAturSandi() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-aura-canvas font-body text-aura-muted">
      Memuat halaman…
    </div>
  );
}
