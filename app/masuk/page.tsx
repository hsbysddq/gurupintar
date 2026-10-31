'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { TulisanGuruPintar } from '@/components/LogoGuruPintar';
import { ErrorApi, masuk } from '@/lib/api-klien';
import { lanjutAman } from '@/lib/auth';

const KELAS_INPUT =
  'h-12 w-full rounded-full border border-white/70 bg-white/65 font-body text-base text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85';

const KELOMPOK = [
  { label: 'Belum', jumlah: 16, lebar: 'w-[42%]', warna: 'bg-aura-red', garis: '' },
  { label: 'Setengah', jumlah: 12, lebar: 'w-[32%]', warna: 'bg-aura-amber', garis: 'border-l-2 border-white' },
  { label: 'Sudah', jumlah: 10, lebar: 'w-[26%]', warna: 'bg-aura-emerald', garis: 'border-l-2 border-white' },
];

const KEUNGGULAN: { label: string; ikon: LucideIcon }[] = [
  { label: 'Kuis 5 soal', ikon: CircleCheck },
  { label: 'Peta kelas otomatis', ikon: Sparkles },
  { label: 'Materi lanjutan', ikon: ShieldCheck },
];

export default function HalamanMasuk() {
  return (
    <Suspense fallback={<FallbackMasuk />}>
      <FormMasuk />
    </Suspense>
  );
}

function FormMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setGalat('Email dan kata sandi wajib diisi.');
      return;
    }
    setMemuat(true);
    setGalat(null);
    try {
      const hasil = await masuk({ email: email.trim(), password });
      router.replace(lanjutAman(params.get('lanjut'), hasil.peran));
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <div className="relative isolate flex min-h-[100dvh] flex-1 flex-col overflow-x-clip bg-aura-canvas font-body text-aura-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-40 size-[520px] rounded-full bg-aura-primary/10 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 size-[460px] rounded-full bg-aura-violet/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 size-[420px] rounded-full bg-[#FB923C]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 72%)',
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-4 py-5 sm:px-5">
        <Link href="/" aria-label="Guru Pintarku, ke beranda" className="flex min-h-12 items-center gap-2.5 rounded-full">
          <TulisanGuruPintar className="h-5 w-auto shrink-0 sm:h-6" />
        </Link>

        <Link
          href="/"
          className="aura-glass-subtle inline-flex min-h-12 items-center gap-1.5 rounded-full px-3.5 font-display text-[12px] font-semibold text-aura-muted transition-colors hover:bg-white/70 hover:text-aura-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Beranda
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-10 px-4 pb-10 sm:px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-16">
        <section aria-labelledby="judul-visual" className="hidden flex-col gap-6 lg:flex">
          <span className="aura-eyebrow w-fit">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Ruang kerja guru & siswa
          </span>

          <h2
            id="judul-visual"
            className="text-balance font-display text-[34px] leading-[42px] font-extrabold tracking-[-0.03em] text-aura-ink"
          >
            Masuk ke kelas yang lebih <span className="text-aura-primary">tenang</span>.
          </h2>

          <p className="max-w-[460px] font-body text-[16px] leading-[26px] text-aura-muted">
            Cek pemahaman, lihat peta kelas, dan bagikan materi lanjutan. Semua dalam satu ruang kerja yang ringan dan
            jelas.
          </p>

          <div className="aura-glass-strong relative overflow-hidden rounded-[28px] p-5">
            <div aria-hidden="true" className="absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-[13px] font-bold text-aura-ink">Peta kelas</p>
                  <p className="font-body text-[11px] leading-[16px] text-aura-muted">Kelas 7A · Matematika</p>
                </div>
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-aura-emerald/10 px-2.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-[#047857]">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />
                  Live
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                    Sudah menjawab
                  </p>
                  <p className="mt-1 font-display text-[32px] leading-[38px] font-extrabold tracking-[-0.03em] text-aura-ink">
                    38<span className="text-[20px] font-bold text-aura-muted">/40</span>
                  </p>
                </div>
                <div className="pb-1 text-right">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">Rata-rata</p>
                  <p className="mt-1 font-display text-[24px] leading-[30px] font-extrabold tracking-[-0.02em] text-aura-primary">
                    72%
                  </p>
                </div>
              </div>

              <div
                role="img"
                aria-label="Contoh: 16 belum paham, 12 setengah paham, 10 paham."
                className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-aura-primary/10 ring-1 ring-inset ring-white/80"
              >
                {KELOMPOK.map((k) => (
                  <span key={k.label} className={`h-full ${k.lebar} ${k.warna} ${k.garis}`} />
                ))}
              </div>

              <ul
                aria-hidden="true"
                className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
              >
                {KELOMPOK.map((k) => (
                  <li key={k.label} className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${k.warna}`} />
                    {k.jumlah} {k.label}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/45 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-aura-primary shadow-sm">
                  <Users aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="font-display text-[12px] font-bold text-aura-ink">3 kelompok belajar</p>
                  <p className="font-body text-[11px] leading-[16px] text-aura-muted">
                    Materi lanjutan siap diperiksa guru
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ul className="flex flex-wrap gap-2">
            {KEUNGGULAN.map(({ label, ikon: Ikon }) => (
              <li
                key={label}
                className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink"
              >
                <Ikon aria-hidden="true" className="size-4 text-aura-emerald" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="judul-masuk" className="mx-auto w-full max-w-[480px]">
          <div className="aura-glass-strong relative overflow-hidden rounded-[28px] p-5 sm:p-7">
            <div aria-hidden="true" className="absolute -left-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-20 -right-16 size-44 rounded-full bg-aura-violet/10 blur-3xl" />

            <div className="relative flex flex-col gap-5">
              <header className="flex flex-col gap-1.5">
                <span className="aura-eyebrow w-fit">Akun</span>
                <h1
                  id="judul-masuk"
                  className="text-balance font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink"
                >
                  Masuk ke Guru Pintar
                </h1>
                <p className="font-body text-[14px] leading-[22px] text-aura-muted">
                  Gunakan akun guru atau siswa yang sudah terdaftar.
                </p>
              </header>

              <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-aura-muted"
                    />
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
                      aria-invalid={galat ? true : undefined}
                      aria-describedby={galat ? 'galat-masuk' : undefined}
                      className={`${KELAS_INPUT} pr-4 pl-11`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
                  >
                    Kata sandi
                  </label>
                  <div className="relative">
                    <KeyRound
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-aura-muted"
                    />
                    <input
                      id="password"
                      name="password"
                      type={lihatSandi ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (galat) setGalat(null);
                      }}
                      autoComplete="current-password"
                      required
                      aria-invalid={galat ? true : undefined}
                      aria-describedby={galat ? 'galat-masuk' : undefined}
                      className={`${KELAS_INPUT} pr-12 pl-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setLihatSandi((v) => !v)}
                      aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      aria-pressed={lihatSandi}
                      className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-aura-muted transition-colors hover:bg-white/70 hover:text-aura-primary"
                    >
                      {lihatSandi ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {galat && (
                  <div
                    id="galat-masuk"
                    role="alert"
                    className="flex items-start gap-2 rounded-2xl border border-aura-red/20 bg-aura-red/5 px-4 py-3 font-body text-[13px] leading-[20px] font-medium text-[#93000a]"
                  >
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {galat}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={memuat}
                  aria-busy={memuat || undefined}
                  className="aura-btn aura-btn-primary h-[52px] w-full px-6 text-[15px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {memuat ? (
                    <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                  ) : (
                    <>
                      Masuk
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-px flex-1 bg-aura-outline/50" />
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                  Belum punya akun?
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-aura-outline/50" />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/daftar/siswa" className="aura-btn aura-btn-secondary h-12 px-4 text-[13px]">
                  Daftar siswa
                </Link>
                <Link href="/daftar/guru" className="aura-btn aura-btn-secondary h-12 px-4 text-[13px]">
                  Daftar guru
                </Link>
              </div>

              <p className="text-center font-body text-[12px] leading-[18px] text-aura-muted">
                Akun guru dan siswa terpisah. Sistem akan mengarahkan ke ruang yang sesuai.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FallbackMasuk() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center gap-3 bg-aura-canvas font-body text-aura-muted">
      <Loader2 aria-hidden="true" className="size-5 animate-spin text-aura-primary" />
      Memuat halaman masuk…
    </div>
  );
}
