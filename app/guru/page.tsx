import Link from 'next/link';
import Image from 'next/image';
import { Archive, ArrowRight, KeyRound, PlayCircle, School, Users } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { PulihkanKelas } from '@/components/PulihkanKelas';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { FormBuatKelas } from './FormBuatKelas';
import { FormKuisBanyak } from './FormKuisBanyak';

const WARNA_MAPEL: Record<string, string> = {
  matematika: '#2563EB',
  'bahasa indonesia': '#7C3AED',
  ipa: '#059669',
  ips: '#E11D48',
  'bahasa inggris': '#D97706',
};

const WARNA_CADANGAN = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#E11D48', '#0F172A'];

function warnaKelas(kelas: { mapel: string; warna: string | null }, indeks: number) {
  return kelas.warna ?? WARNA_MAPEL[kelas.mapel.trim().toLowerCase()] ?? WARNA_CADANGAN[indeks % WARNA_CADANGAN.length];
}

// Daftar kelas milik guru. Satu kartu per kelas, dengan status kuis aktifnya.
export default async function HalamanDaftarKelas({
  searchParams,
}: {
  searchParams: Promise<{ arsip?: string }>;
}) {
  const { arsip } = await searchParams;
  const modeArsip = arsip === '1';
  const profil = await profilWajib('guru');
  const daftar = await ambilKelasGuru(ambilSupabase(), profil.id, { arsip: modeArsip });

  if (modeArsip) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link href="/guru" className="text-[13px] leading-normal font-semibold text-primer hover:underline">
            ← Kembali ke kelas aktif
          </Link>
          <h1 className="flex items-center gap-2 text-[28px] leading-tight font-bold">
            <Archive aria-hidden="true" className="size-7 text-tinta-lembut" />
            Kelas diarsipkan
          </h1>
          <p className="text-tinta-lembut">
            Kelas di sini tidak muncul di daftar aktif dan tidak bisa dipakai untuk kuis baru. Datanya tetap tersimpan.
          </p>
        </header>

        {daftar.length === 0 ? (
          <KartuKaca as="section" className="p-6">
            <p className="text-tinta-lembut">Belum ada kelas yang diarsipkan.</p>
          </KartuKaca>
        ) : (
          <ul className="flex flex-col gap-3">
            {daftar.map((kelas) => (
              <li key={kelas.id}>
                <KartuKaca as="div" className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg leading-snug font-semibold">{kelas.nama}</h2>
                    <p className="text-[14px] leading-normal text-tinta-lembut">
                      {kelas.mapel} · {kelas.jumlahSiswa} siswa · Kode {kelas.kodeUndangan}
                    </p>
                  </div>
                  <PulihkanKelas id={kelas.id} />
                </KartuKaca>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const totalSiswa = daftar.reduce((jumlah, kelas) => jumlah + kelas.jumlahSiswa, 0);
  const jumlahKuisAktif = daftar.filter((kelas) => kelas.kuisAktif).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">
            Ruang guru
          </span>
          <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
            Kelas saya
          </h1>
          <p className="max-w-2xl font-body text-[14px] leading-[22px] text-aura-muted">
            {daftar.length > 0
              ? 'Pilih kelas untuk membuka kuis, melihat hasil, dan membagikan materi.'
              : 'Belum ada kelas. Buat kelas pertama untuk mulai mengajar.'}
          </p>
        </div>

        {daftar.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
              <School aria-hidden="true" className="size-4 text-aura-primary" />
              {daftar.length} kelas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
              <Users aria-hidden="true" className="size-4 text-aura-indigo" />
              {totalSiswa} siswa
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
              <PlayCircle aria-hidden="true" className="size-4 text-aura-emerald" />
              {jumlahKuisAktif} kuis aktif
            </span>
          </div>
        )}
      </header>

      <FormBuatKelas pertamaKali={daftar.length === 0} />

      {daftar.length > 0 ? (
        <section aria-labelledby="judul-daftar-kelas" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 id="judul-daftar-kelas" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
                Daftar kelas
              </h2>
              <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                Klik kartu untuk masuk ke ruang kelas.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[18px] border border-white/70 bg-white/35 px-4 py-2.5 shadow-[0_14px_32px_-20px_rgba(37,99,235,0.55)] backdrop-blur-xl">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -top-4 size-12 rounded-full bg-aura-violet/20 blur-2xl"
              />
              <span className="relative flex items-baseline gap-1.5">
                <span className="bg-gradient-to-br from-aura-ink via-aura-primary to-aura-violet bg-clip-text font-display text-[24px] leading-none font-extrabold tracking-[-0.04em] text-transparent">
                  {daftar.length}
                </span>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-aura-muted">
                  kelas
                </span>
              </span>
            </div>
          </div>

          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {daftar.map((kelas, indeks) => {
              const progres =
                kelas.kuisAktif && kelas.jumlahSiswa > 0
                  ? Math.round((kelas.kuisAktif.jumlahMenjawab / kelas.jumlahSiswa) * 100)
                  : 0;
              const warna = warnaKelas(kelas, indeks);

              return (
                <li key={kelas.id} className="h-full">
                  <Link href={`/guru/kelas?kelas=${kelas.id}`} className="group block h-full">
                    <article className="aura-glass relative flex h-full flex-col gap-4 overflow-hidden rounded-[24px] p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-white/90 group-hover:shadow-[0_24px_48px_-24px_rgba(37,99,235,0.35)]">
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-1"
                        style={{ background: `linear-gradient(90deg, ${warna}, ${warna}66 55%, #10B981)` }}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full blur-2xl"
                        style={{ backgroundColor: `${warna}1A` }}
                      />

                      {kelas.sampul && (
                        <div className="relative -mx-5 -mt-5 mb-1 h-20 overflow-hidden">
                          <Image
                            src={kelas.sampul}
                            alt=""
                            fill
                            unoptimized
                            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                          />
                          <span className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/15 to-transparent" />
                        </div>
                      )}

                      <div className="relative flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className="flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/70"
                            style={{ backgroundColor: `${warna}14`, color: warna, boxShadow: `inset 0 0 0 1px ${warna}24` }}
                          >
                            <School aria-hidden="true" className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="break-words font-display text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-aura-ink">
                              {kelas.mapel}
                            </h3>
                            <p className="mt-0.5 font-body text-[12px] leading-[18px] font-semibold" style={{ color: warna }}>
                              {kelas.nama}
                            </p>
                          </div>
                        </div>
                        {kelas.kuisAktif ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-aura-emerald/20 bg-aura-emerald/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-[#047857]">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />
                            Kuis aktif
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-white/60 bg-white/50 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                            Belum ada kuis
                          </span>
                        )}
                      </div>

                      <dl className="relative grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-white/50 bg-white/45 px-2.5 py-2">
                          <dt className="flex items-center gap-1 font-display text-[9px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                            <Users aria-hidden="true" className="size-3" />
                            Siswa
                          </dt>
                          <dd className="mt-0.5 font-display text-[16px] leading-[20px] font-bold tabular-nums text-aura-ink">
                            {kelas.jumlahSiswa}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-white/50 bg-white/45 px-2.5 py-2">
                          <dt className="flex items-center gap-1 font-display text-[9px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                            <KeyRound aria-hidden="true" className="size-3" />
                            Kode
                          </dt>
                          <dd className="mt-0.5 font-display text-[13px] leading-[20px] font-bold tracking-[0.08em] text-aura-ink">
                            {kelas.kodeUndangan}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-white/50 bg-white/45 px-2.5 py-2">
                          <dt className="flex items-center gap-1 font-display text-[9px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                            <PlayCircle aria-hidden="true" className="size-3" />
                            Kuis
                          </dt>
                          <dd className="mt-0.5 font-display text-[13px] leading-[20px] font-bold tracking-[0.08em] text-aura-ink">
                            {kelas.kuisAktif ? kelas.kuisAktif.kodeKelas : '—'}
                          </dd>
                        </div>
                      </dl>

                      {kelas.kuisAktif ? (
                        <div className="relative flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2 font-body text-[12px] leading-[18px] text-aura-muted">
                            <span>
                              {kelas.kuisAktif.jumlahMenjawab}/{kelas.jumlahSiswa} menjawab
                            </span>
                            <span className="font-display font-semibold text-aura-ink">{progres}%</span>
                          </div>
                          <div
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progres}
                            aria-label={`${progres}% siswa menjawab`}
                            className="h-1.5 overflow-hidden rounded-full bg-aura-primary/10"
                          >
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${progres}%`, background: `linear-gradient(90deg, ${warna}, ${warna}AA)` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="relative font-body text-[12px] leading-[18px] text-aura-muted">
                          Buka kuis dari ruang kelas untuk mulai mengumpulkan jawaban.
                        </p>
                      )}

                      <span
                        className="relative mt-auto inline-flex items-center gap-1.5 font-display text-[13px] font-semibold"
                        style={{ color: warna }}
                      >
                        Kelola kelas
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </article>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <div className="aura-glass flex flex-col items-center gap-3 rounded-[24px] p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
            <School aria-hidden="true" className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-display text-[16px] leading-[24px] font-semibold text-aura-ink">Belum ada kelas</p>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Isi form di atas untuk membuat kelas pertamamu.
            </p>
          </div>
        </div>
      )}

      <FormKuisBanyak kelas={daftar} />

      <div className="flex justify-end">
        <Link
          href="/guru?arsip=1"
          className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-4 py-2 font-display text-[12px] font-semibold text-aura-muted backdrop-blur-sm transition-colors hover:text-aura-primary"
        >
          <Archive aria-hidden="true" className="size-4" />
          Lihat kelas diarsipkan
        </Link>
      </div>
    </div>
  );
}
