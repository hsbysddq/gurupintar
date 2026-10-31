'use client';

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { useSiswa } from '@/components/PenyediaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, gabungSesi } from '@/lib/api-klien';
import { simpanSesi } from '@/lib/sesi-lokal';
import { normalisasiKode } from '@/lib/skema-api';

// Kode kuis biasanya 5–6 karakter (skema kode kelas di server).
const MIN_PANJANG_KODE = 5;

export default function HalamanGabungKelas() {
  return (
    <Suspense
      fallback={
        <KerangkaSiswa>
          <StatusHalaman jenis="memuat" judul="Memuat halaman" />
        </KerangkaSiswa>
      }
    >
      <GabungKelas />
    </Suspense>
  );
}

function GabungKelas() {
  const router = useRouter();
  const params = useSearchParams();
  const profil = useSiswa();
  const kodeAwal = normalisasiKode(params.get("kode") ?? "");
  // Datang dari beranda atau kartu kuis dengan kode terisi: langsung diperiksa, siswa tidak perlu menekan Lanjut lagi.
  const langsung = kodeAwal.length >= MIN_PANJANG_KODE;
  const [kode, setKode] = useState(kodeAwal);
  const [memuat, setMemuat] = useState(langsung);
  const [galat, setGalat] = useState<string | null>(null);
  const sudahLangsung = useRef(false);

  async function masuk(kodeDipakai: string) {
    try {
      const { sesi } = await gabungSesi(kodeDipakai);
      simpanSesi({ sesiId: sesi.id, kodeKelas: sesi.kodeKelas, format: null, kelasId: sesi.kelasId });
      router.push('/siswa/format');
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Terjadi kesalahan. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  useEffect(() => {
    if (!langsung || sudahLangsung.current) return;
    sudahLangsung.current = true;
    void masuk(kodeAwal);
    // Hanya sekali saat halaman dibuka; kode salah tidak diulang otomatis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cariKelas(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    void masuk(kode);
  }

  return (
    <KerangkaSiswa>
      <header className="flex flex-col gap-1.5">
        <span className="aura-eyebrow">Ruang siswa</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink md:text-[32px]">
          Masukkan kode kuis
        </h1>
        <p className="text-aura-muted">Halo, {profil.nama}. Kode kuis ada di layar gurumu.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-5">
          <form onSubmit={cariKelas} className="aura-glass flex max-w-xl flex-col gap-4 rounded-[24px] p-5 sm:p-6" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="kode" className="text-[13px] leading-normal font-semibold text-aura-ink">
                Kode kuis
              </label>
              <input
                id="kode"
                name="kode"
                value={kode}
                onChange={(e) => setKode(normalisasiKode(e.target.value))}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={6}
                placeholder="A7K2P"
                aria-invalid={galat ? true : undefined}
                aria-describedby={galat ? 'galat-kode' : undefined}
                className="h-14 rounded-2xl border border-white/70 bg-white/75 px-4 text-2xl font-display font-extrabold tracking-[0.3em] text-aura-ink placeholder:text-aura-muted/45 focus:border-aura-primary focus:outline-none focus:ring-2 focus:ring-aura-primary/20"
              />
              {galat && (
                <p id="galat-kode" role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
                  {galat}
                </p>
              )}
            </div>
            <Tombol varian="utama" ukuran="besar" type="submit" lebarPenuh memuat={memuat} disabled={kode.length === 0}>
              Lanjut
            </Tombol>
          </form>

          <div className="flex max-w-xl flex-col gap-1 border-t border-white/60 pt-4">
            <Tombol varian="teks" lebarPenuh href="/siswa/performa">
              Lihat performa dan riwayatku
            </Tombol>
            <p className="text-center text-[13px] leading-normal text-aura-muted">
              Sudah punya mata pelajaran?{' '}
              <Link href="/siswa/kelas" className="font-semibold text-aura-primary hover:underline">
                Lihat mata pelajaran
              </Link>
            </p>
            <Tombol varian="teks" lebarPenuh href="/siswa">
              Kembali ke beranda
            </Tombol>
          </div>
        </div>

        <aside className="aura-glass flex flex-col gap-4 rounded-[24px] p-5 lg:sticky lg:top-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
              <KeyRound aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-[16px] leading-snug font-bold text-aura-ink">Baru pertama kali?</h2>
              <p className="text-[13px] leading-normal text-aura-muted">Ikuti langkah singkat ini.</p>
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {[
              'Minta kode kuis dari gurumu.',
              'Masukkan kode pada kolom di samping.',
              'Pilih bentuk materi yang paling nyaman.',
              'Kerjakan kuis dan lihat hasilnya.',
            ].map((langkah, indeks) => (
              <li key={langkah} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/80 font-display text-[11px] font-bold text-aura-primary">
                  {indeks + 1}
                </span>
                <span className="text-[13px] leading-[20px] text-aura-ink">{langkah}</span>
              </li>
            ))}
          </ol>
          <p className="rounded-2xl bg-aura-primary/5 p-3 text-[12px] leading-[18px] text-aura-muted">
            Kode kuis biasanya terdiri dari 5–6 karakter, misalnya <strong className="text-aura-ink">A7K2P</strong>.
          </p>
        </aside>
      </div>
    </KerangkaSiswa>
  );
}
