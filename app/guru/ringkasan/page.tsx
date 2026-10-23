import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CircleCheck,
  KeyRound,
  LayoutGrid,
  PlayCircle,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { profilWajib } from '@/lib/server/auth';
import { ambilRingkasanKelas } from '@/lib/server/ringkasan-kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import type { RingkasanKelas } from '@/lib/tipe';

const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default async function HalamanRingkasan() {
  const profil = await profilWajib('guru');
  const daftar = await ambilRingkasanKelas(ambilSupabase(), profil.id);

  const totalSiswa = daftar.reduce((n, k) => n + k.jumlahSiswa, 0);
  const totalKuisAktif = daftar.filter((k) => k.kuisAktif).length;
  const totalPendampingan = daftar.reduce((n, k) => n + k.jumlahPerluPendampingan, 0);
  const totalLainnya = Math.max(0, totalSiswa - totalPendampingan);
  const persenPendampingan = totalSiswa > 0 ? Math.round((totalPendampingan / totalSiswa) * 100) : 0;

  return (
    <div className="relative isolate -mx-4 -my-6 flex flex-col gap-6 overflow-x-clip bg-aura-canvas px-4 py-6 md:-m-8 md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-aura-primary/10 blur-[100px]" />
        <div className="absolute -right-20 top-40 size-72 rounded-full bg-aura-violet/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-[#FB923C]/10 blur-[100px]" />
      </div>

      <header className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <span className="aura-eyebrow">
              <BarChart3 aria-hidden="true" className="size-3.5" />
              Ringkasan
            </span>
            <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
              Ringkasan kelas
            </h1>
            <p className="font-body text-[14px] leading-[22px] text-aura-muted">
              Kondisi semua kelasmu dalam satu layar: siswa, kuis aktif, sesi terakhir, dan siapa yang perlu bantuan.
            </p>
          </div>

          <Link
            href="/guru"
            className="aura-btn aura-btn-secondary h-12 w-full shrink-0 px-4 text-[13px] sm:w-auto"
          >
            <LayoutGrid aria-hidden="true" className="size-4" />
            Semua kelas
          </Link>
        </div>
      </header>

      {daftar.length === 0 ? (
        <PanelKosong />
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KartuStat
              label="Kelas aktif"
              nilai={daftar.length}
              satuan="kelas"
              keterangan="terdaftar di akunmu"
              ikon={LayoutGrid}
              aksen="from-aura-primary to-aura-indigo"
            />
            <KartuStat
              label="Total siswa"
              nilai={totalSiswa}
              satuan="siswa"
              keterangan="di semua kelas"
              ikon={Users}
              aksen="from-aura-indigo to-aura-violet"
            />
            <KartuStat
              label="Kuis aktif"
              nilai={totalKuisAktif}
              satuan="kuis"
              keterangan="sedang berjalan"
              ikon={PlayCircle}
              aksen="from-aura-emerald to-aura-primary"
            />
            <KartuStat
              label="Perlu pendampingan"
              nilai={totalPendampingan}
              satuan="siswa"
              keterangan="butuh bantuan hari ini"
              ikon={AlertCircle}
              aksen={totalPendampingan > 0 ? 'from-aura-red to-aura-amber' : 'from-aura-emerald to-aura-primary'}
              nada={totalPendampingan > 0 ? 'text-aura-red' : 'text-aura-ink'}
            />
          </dl>

          <section aria-labelledby="judul-perhatian" className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-aura-amber/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-xl flex-col gap-2">
                <span className="aura-eyebrow">
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  Perlu perhatian
                </span>
                <h2
                  id="judul-perhatian"
                  className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink"
                >
                  Pantau siswa yang butuh bantuan hari ini.
                </h2>
                <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                  Angka ini dihitung dari seluruh kelas yang kamu ajar. Buka kelas untuk melihat detail dan saran
                  pendampingan.
                </p>
              </div>

              <div className="flex items-end gap-2">
                <span className="font-display text-[38px] leading-[44px] font-extrabold tracking-[-0.03em] tabular-nums text-aura-ink">
                  {totalPendampingan}
                </span>
                <span className="pb-1 font-display text-[13px] font-semibold text-aura-muted">
                  dari {totalSiswa} siswa
                </span>
              </div>
            </div>

            <div className="relative mt-5">
              <div
                role="img"
                aria-label={`${totalPendampingan} siswa perlu pendampingan dan ${totalLainnya} siswa lainnya dari total ${totalSiswa} siswa.`}
                className="flex h-2.5 overflow-hidden rounded-full bg-aura-primary/10 ring-1 ring-inset ring-white/80"
              >
                <span className="h-full bg-aura-red transition-[width] duration-300" style={{ width: `${persenPendampingan}%` }} />
                <span className="h-full flex-1 bg-aura-emerald/60" />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-full bg-aura-red" />
                  {totalPendampingan} perlu pendampingan
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-full bg-aura-emerald/60" />
                  {totalLainnya} siswa lainnya
                </span>
              </div>
            </div>
          </section>

          <section aria-labelledby="judul-kelas" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="aura-eyebrow">Kelas</span>
                <h2
                  id="judul-kelas"
                  className="mt-2 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink"
                >
                  Kondisi tiap kelas
                </h2>
              </div>
              <span className="font-body text-[12px] leading-[18px] text-aura-muted">{daftar.length} kelas</span>
            </div>

            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {daftar.map((kelas) => (
                <li key={kelas.id}>
                  <KartuKelas kelas={kelas} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function KartuStat({
  label,
  nilai,
  satuan,
  keterangan,
  ikon: Ikon,
  aksen,
  nada = 'text-aura-ink',
}: {
  label: string;
  nilai: number;
  satuan: string;
  keterangan: string;
  ikon: LucideIcon;
  aksen: string;
  nada?: string;
}) {
  return (
    <div className="aura-glass relative overflow-hidden rounded-[24px] p-4 sm:p-5">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${aksen}`} />
      <div className="flex items-start justify-between gap-3">
        <dt className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">{label}</dt>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/60 text-aura-primary ring-1 ring-white/70">
          <Ikon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <dd className={`mt-2 font-display text-[32px] leading-[38px] font-extrabold tracking-[-0.025em] tabular-nums sm:text-[38px] sm:leading-[44px] ${nada}`}>
        {nilai}
      </dd>
      <p className="mt-0.5 font-display text-[12px] leading-[18px] font-semibold text-aura-muted">
        {satuan} · {keterangan}
      </p>
    </div>
  );
}

function KartuKelas({ kelas }: { kelas: RingkasanKelas }) {
  const persenMenjawab =
    kelas.kuisAktif && kelas.jumlahSiswa > 0
      ? Math.min(100, Math.round((kelas.kuisAktif.jumlahMenjawab / kelas.jumlahSiswa) * 100))
      : 0;
  const perluPendampingan = kelas.jumlahPerluPendampingan > 0;

  return (
    <article className="aura-glass flex h-full flex-col gap-4 rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
            {kelas.nama}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 font-body text-[13px] leading-[20px] text-aura-muted">
            <BookOpen aria-hidden="true" className="size-3.5 shrink-0 text-aura-primary" />
            {kelas.mapel}
          </p>
        </div>
        {kelas.kuisAktif ? (
          <span className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-aura-emerald/10 px-2.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-[#047857]">
            <PlayCircle aria-hidden="true" className="size-3.5" />
            Kuis aktif
          </span>
        ) : (
          <span className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-white/60 px-2.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
            Tanpa kuis
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 rounded-2xl border border-white/60 bg-white/40 p-3">
        <div className="min-w-0">
          <dt className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">Siswa</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 font-display text-[20px] leading-[26px] font-bold tabular-nums text-aura-ink">
            <Users aria-hidden="true" className="size-4 text-aura-primary" />
            {kelas.jumlahSiswa}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">Sesi</dt>
          <dd className="mt-0.5 font-display text-[20px] leading-[26px] font-bold tabular-nums text-aura-ink">
            {kelas.jumlahSesi}
          </dd>
          <p className="mt-0.5 font-body text-[11px] leading-[16px] text-aura-muted">
            {kelas.sesiTerakhir ? `Terakhir ${FORMAT_TANGGAL.format(new Date(kelas.sesiTerakhir))}` : 'Belum ada sesi'}
          </p>
        </div>
      </dl>

      {kelas.kuisAktif && (
        <div className="rounded-2xl border border-aura-primary/15 bg-aura-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-body text-[12px] leading-[18px] text-aura-muted">
              <KeyRound aria-hidden="true" className="size-3.5 shrink-0 text-aura-primary" />
              Kode{' '}
              <strong className="font-semibold tracking-wide text-aura-ink">{kelas.kuisAktif.kodeKelas}</strong>
            </span>
            <span className="font-display text-[12px] font-bold tabular-nums text-aura-ink">
              {kelas.kuisAktif.jumlahMenjawab}/{kelas.jumlahSiswa} menjawab
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Siswa yang sudah menjawab di ${kelas.nama}`}
            aria-valuemin={0}
            aria-valuemax={kelas.jumlahSiswa}
            aria-valuenow={kelas.kuisAktif.jumlahMenjawab}
            className="mt-2 h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-white/80"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-aura-primary to-aura-indigo transition-[width] duration-300"
              style={{ width: `${persenMenjawab}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 font-body text-[13px] leading-[20px] font-medium ${
          perluPendampingan ? 'bg-aura-amber/10 text-[#92400e]' : 'bg-aura-emerald/10 text-[#047857]'
        }`}
      >
        {perluPendampingan ? (
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        )}
        {perluPendampingan
          ? `${kelas.jumlahPerluPendampingan} siswa perlu pendampingan`
          : 'Tidak ada yang perlu pendampingan'}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={`/guru/kelas?kelas=${kelas.id}`} className="aura-btn aura-btn-primary h-11 px-4 text-[13px]">
          Buka kelas
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
        <Link href={`/guru/pendampingan?kelas=${kelas.id}`} className="aura-btn aura-btn-secondary h-11 px-4 text-[13px]">
          Pendampingan
        </Link>
      </div>
    </article>
  );
}

function PanelKosong() {
  return (
    <section className="aura-glass flex flex-col items-center gap-4 rounded-[28px] p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary/10 to-aura-violet/15 text-aura-primary ring-1 ring-white/70">
        <LayoutGrid aria-hidden="true" className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
          Belum ada kelas
        </h2>
        <p className="font-body text-[13px] leading-[20px] text-aura-muted">
          Buat kelas pertamamu untuk melihat ringkasan siswa, kuis, dan pendampingan di sini.
        </p>
      </div>
      <Link href="/guru" className="aura-btn aura-btn-primary h-12 px-6 text-[15px]">
        Ke daftar kelas
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}
