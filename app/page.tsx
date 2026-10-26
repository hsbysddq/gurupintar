import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  FileText,
  Headphones,
  HeartHandshake,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Pencil,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { TulisanGuruPintar } from "@/components/LogoGuruPintar";
import { NavbarLanding } from "@/components/NavbarLanding";
import { PratinjauDasbor } from "@/components/PratinjauDasbor";

export const metadata: Metadata = {
  title: "Guru Pintar: tahu siapa yang tertinggal hari ini",
  description:
    "Cek pemahaman kilat 5 soal dari HP siswa, peta kelas dalam hitungan menit, dan materi lanjutan per kelompok yang dibuat dengan bantuan AI lalu diperiksa guru.",
};

const KEUNGGULAN = ["Kuis 5 soal", "Tanpa instal", "Hasil dalam 3 detik"];

const MASALAH: { label: string; angka: string; satuan: string; keterangan: string; aksen: string }[] = [
  { label: "Ukuran kelas", angka: "40", satuan: "siswa", keterangan: "dalam satu kelas", aksen: "from-aura-red to-aura-amber" },
  { label: "Waktu mengajar", angka: "80", satuan: "menit", keterangan: "dua jam pelajaran", aksen: "from-aura-amber to-aura-primary" },
  { label: "Waktu per anak", angka: "2", satuan: "menit", keterangan: "jika waktunya dibagi rata", aksen: "from-aura-primary to-aura-violet" },
];

const LANGKAH: { judul: string; isi: string; ikon: LucideIcon }[] = [
  {
    judul: "Cek",
    isi: "Buka kuis 5 soal. Siswa bergabung dari HP dengan kode kelas atau QR dan menjawab dalam beberapa menit.",
    ikon: ListChecks,
  },
  {
    judul: "Petakan",
    isi: "Jawaban langsung terpetakan menjadi tiga kelompok, lengkap dengan soal yang paling banyak salah.",
    ikon: LayoutGrid,
  },
  {
    judul: "Tindak lanjut",
    isi: "AI menyusun materi lanjutan untuk tiap kelompok. Guru memeriksa dan menyesuaikannya, lalu membagikannya.",
    ikon: Sparkles,
  },
];

// Ikon sama dengan tab di TabMateriSiswa.
const BENTUK_MATERI: { label: string; ikon: LucideIcon }[] = [
  { label: "Video", ikon: PlayCircle },
  { label: "Audio", ikon: Headphones },
  { label: "Bacaan", ikon: FileText },
  { label: "Latihan", ikon: Pencil },
];

const KELOMPOK_PETA = [
  { label: "Belum paham", jumlah: 16, lebar: "w-[42%]", warna: "bg-aura-red", garis: "" },
  { label: "Setengah paham", jumlah: 12, lebar: "w-[32%]", warna: "bg-aura-amber", garis: "border-l-2 border-white" },
  { label: "Sudah paham", jumlah: 10, lebar: "w-[26%]", warna: "bg-aura-emerald", garis: "border-l-2 border-white" },
];

// Bento kecil; peta kelas dan materi AI ditulis terpisah karena isinya berbeda.
const FITUR_KECIL: { judul: string; isi: string; ikon: LucideIcon; kelas: string }[] = [
  {
    judul: "Soal paling banyak salah",
    isi: "Lengkap dengan kesalahan pemahaman yang paling sering muncul, jadi guru tahu apa yang perlu diluruskan.",
    ikon: Lightbulb,
    kelas: "lg:col-span-3",
  },
  {
    judul: "Perlu pendampingan",
    isi: "Siswa yang berulang kali tertinggal, tidak mengerjakan, atau skornya terus turun ditandai beserta saran tindakan.",
    ikon: HeartHandshake,
    kelas: "lg:col-span-3",
  },
  {
    judul: "Ubah modul",
    isi: "Tempelkan teks modul matematika kelas 7, lalu lihat pratinjaunya dalam empat bentuk belajar.",
    ikon: FileText,
    kelas: "lg:col-span-3",
  },
  {
    judul: "Buat soal sendiri",
    isi: "Susun topik dengan 5 soal pilihan ganda beserta kesalahan pemahaman tiap pilihan, lalu pakai untuk kuis berikutnya.",
    ikon: ListChecks,
    kelas: "lg:col-span-3",
  },
];

const PRINSIP = [
  "Materi AI selalu berupa draf sampai guru memeriksanya dan menekan Bagikan ke Siswa.",
  "Guru Pintar tidak mengirim nama atau data siswa ke AI.",
  "Siswa tidak pernah melihat label kelompoknya. Yang mereka lihat hanya Materi untukmu.",
  "Pilihan bentuk materi hanya preferensi siswa yang bisa diganti kapan saja, bukan diagnosis gaya belajar.",
];

const KARTU = "aura-glass rounded-[24px]";

function JudulBagian({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <span className="aura-eyebrow w-fit">{eyebrow}</span>
      <h2
        id={id}
        className="text-balance font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink md:text-[32px] md:leading-[1.15]"
      >
        {title}
      </h2>
      {description && <p className="font-body text-[15px] leading-[26px] text-aura-muted">{description}</p>}
    </div>
  );
}

function IkonKotak({ ikon: Ikon }: { ikon: LucideIcon }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary/10 via-aura-primary/5 to-aura-violet/15 text-aura-primary ring-1 ring-white/70">
      <Ikon aria-hidden="true" className="size-5" />
    </span>
  );
}

// design.md 3.10. Server Component tanpa data dari database.
export default function Beranda() {
  return (
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip bg-aura-canvas font-body text-aura-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-40 size-[520px] rounded-full bg-aura-primary/10 blur-[120px]" />
        <div className="absolute -right-32 top-40 size-[480px] rounded-full bg-aura-violet/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 size-[420px] rounded-full bg-[#FB923C]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 72%)",
          }}
        />
      </div>

      <NavbarLanding />

      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-4 pt-10 pb-20 text-[15px] leading-relaxed sm:px-5 md:gap-24 md:px-8 md:pt-16">
        <section
          id="atas"
          aria-labelledby="judul-hero"
          className="grid scroll-mt-28 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
        >
          <div className="flex flex-col items-start gap-6">
            <span className="aura-eyebrow">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Guru SMP · Kurikulum Merdeka
            </span>

            <h1
              id="judul-hero"
              className="text-balance font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink min-[390px]:text-[34px] min-[390px]:leading-[42px] min-[390px]:tracking-[-0.03em] lg:text-[52px] lg:leading-[1.05]"
            >
              Tahu siapa yang tertinggal <span className="text-aura-primary">hari ini</span>, bukan saat ulangan.
            </h1>

            <p className="max-w-[560px] font-body text-[16px] leading-[26px] text-aura-muted">
              Cek pemahaman kilat 5 soal dari HP siswa, lalu materi lanjutan untuk tiap kelompok disusun dengan bantuan AI
              dan diperiksa guru.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/masuk" className="aura-btn aura-btn-primary h-[52px] w-full px-6 text-[15px] sm:w-auto">
                Masuk sebagai guru
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/masuk" className="aura-btn aura-btn-secondary h-[50px] w-full px-6 text-[15px] sm:w-auto">
                <Users aria-hidden="true" className="size-4" />
                Masuk sebagai siswa
              </Link>
            </div>

            <ul className="flex flex-wrap gap-2">
              {KEUNGGULAN.map((k) => (
                <li
                  key={k}
                  className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink"
                >
                  <CircleCheck aria-hidden="true" className="size-4 text-aura-emerald" />
                  {k}
                </li>
              ))}
            </ul>
          </div>

          <PratinjauDasbor />
        </section>

        <section id="masalah" aria-labelledby="judul-masalah" className="flex scroll-mt-28 flex-col gap-8">
          <JudulBagian
            id="judul-masalah"
            eyebrow="Masalah"
            title="Satu guru tidak bisa menanyai 40 anak satu per satu"
            description="Di kelas yang penuh, anak yang tertinggal sering baru terlihat saat ulangan. Padahal bantuan paling berguna diberikan hari itu juga."
          />

          <dl className="grid gap-4 sm:grid-cols-3">
            {MASALAH.map(({ label, angka, satuan, keterangan, aksen }) => (
              <div key={label} className={`${KARTU} relative overflow-hidden p-5 sm:p-6`}>
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${aksen}`} />
                <dt className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">{label}</dt>
                <dd className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-[32px] leading-[38px] font-extrabold tracking-[-0.025em] text-aura-ink sm:text-[38px] sm:leading-[44px]">
                    {angka}
                  </span>
                  <span className="font-display text-[15px] font-semibold text-aura-muted">{satuan}</span>
                </dd>
                <dd className="mt-1 font-body text-[13px] leading-[18px] text-aura-muted">{keterangan}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-[760px] rounded-[24px] border-l-4 border-aura-primary/30 bg-white/45 px-5 py-4 font-body text-[15px] leading-[26px] text-aura-muted backdrop-blur-sm">
            Waktunya tidak cukup untuk memastikan setiap anak paham. Siswa yang tertinggal berada di zona buta, dan sering
            baru terlihat saat ulangan, ketika kesenjangannya sudah lebar dan semangatnya sudah turun.
          </p>
        </section>

        <section id="cara-kerja" aria-labelledby="judul-cara" className="flex scroll-mt-28 flex-col gap-8">
          <JudulBagian
            id="judul-cara"
            eyebrow="Cara kerja"
            title="Tiga langkah, satu siklus yang jelas"
            description="Dari kuis singkat sampai materi yang tepat sasaran, semuanya terjadi dalam alur yang sama."
          />

          <ol className="relative grid gap-4 md:grid-cols-3">
            <span
              aria-hidden="true"
              className="absolute top-10 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-aura-primary/20 via-aura-violet/30 to-aura-emerald/30 md:block"
            />
            {LANGKAH.map(({ judul, isi, ikon: Ikon }, i) => (
              <li key={judul} className="relative">
                <div className={`${KARTU} flex h-full flex-col gap-4 p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-aura-primary font-display text-[13px] font-extrabold text-white shadow-[0_6px_16px_rgba(37,99,235,0.28)]">
                      {i + 1}
                    </span>
                    <IkonKotak ikon={Ikon} />
                  </div>
                  <h3 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">{judul}</h3>
                  <p className="font-body text-[14px] leading-[22px] text-aura-muted">{isi}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="fitur" aria-labelledby="judul-fitur" className="flex scroll-mt-28 flex-col gap-8">
          <JudulBagian
            id="judul-fitur"
            eyebrow="Fitur"
            title="Yang bisa dilakukan guru"
            description="Diagnosis kelas, materi yang bisa disesuaikan, dan alat bantu mengajar dalam satu ruang kerja."
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            <article className={`${KARTU} flex flex-col gap-5 p-6 md:col-span-2 lg:col-span-7`}>
              <IkonKotak ikon={LayoutGrid} />
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">Peta kelas</h3>
                <p className="font-body text-[14px] leading-[22px] text-aura-muted">
                  Siapa yang sudah, setengah, dan belum paham terlihat dalam satu layar, bukan di tumpukan kertas.
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-4 pt-2">
                <div
                  role="img"
                  aria-label="Contoh: 16 belum paham, 12 setengah paham, 10 sudah paham."
                  className="flex h-2.5 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-white/80"
                >
                  {KELOMPOK_PETA.map((k) => (
                    <span key={k.label} className={`h-full ${k.lebar} ${k.warna} ${k.garis}`} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {KELOMPOK_PETA.map((k) => (
                    <div key={k.label} className="rounded-2xl border border-white/60 bg-white/50 p-3">
                      <span aria-hidden="true" className={`block size-2 rounded-full ${k.warna}`} />
                      <p className="mt-2 font-display text-[20px] leading-[24px] font-bold tracking-[-0.015em] text-aura-ink">
                        {k.jumlah}
                      </p>
                      <p className="font-body text-[11px] leading-[16px] text-aura-muted">{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className={`${KARTU} flex flex-col gap-5 p-6 md:col-span-2 lg:col-span-5`}>
              <div className="flex items-start justify-between gap-3">
                <IkonKotak ikon={Sparkles} />
                <span className="rounded-full border border-aura-primary/15 bg-aura-primary/5 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-primary">
                  Draf AI
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
                  Materi AI dalam 4 bentuk
                </h3>
                <p className="font-body text-[14px] leading-[22px] text-aura-muted">
                  Satu materi untuk tiap kelompok. Siswa membukanya dalam bentuk yang mereka pilih.
                </p>
              </div>
              <ul className="mt-auto grid grid-cols-2 gap-2">
                {BENTUK_MATERI.map(({ label, ikon: Ikon }) => (
                  <li
                    key={label}
                    className="flex flex-col items-center gap-2 rounded-full border border-aura-primary/15 bg-aura-primary/5 px-3 py-4 text-center"
                  >
                    <Ikon aria-hidden="true" className="size-5 text-aura-primary" />
                    <span className="font-display text-[13px] font-semibold text-aura-ink">{label}</span>
                  </li>
                ))}
              </ul>
            </article>

            {FITUR_KECIL.map(({ judul, isi, ikon: Ikon, kelas }) => (
              <article key={judul} className={`${KARTU} flex h-full flex-col gap-4 p-5 sm:p-6 ${kelas}`}>
                <IkonKotak ikon={Ikon} />
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-[16px] leading-[24px] font-semibold tracking-[-0.01em] text-aura-ink">
                    {judul}
                  </h3>
                  <p className="font-body text-[14px] leading-[22px] text-aura-muted">{isi}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="prinsip" aria-labelledby="judul-prinsip" className="flex scroll-mt-28 flex-col gap-8">
          <JudulBagian
            id="judul-prinsip"
            eyebrow="Prinsip"
            title="AI membantu, guru tetap memutuskan"
            description="Teknologi tidak boleh mengambil alih penilaian pedagogis. Karena itu setiap materi tetap melewati tangan guru."
          />

          <div className={`${KARTU} relative overflow-hidden p-6 md:p-10`}>
            <span
              aria-hidden="true"
              className="absolute inset-y-6 left-0 w-1 rounded-full bg-gradient-to-b from-aura-emerald via-aura-primary to-aura-violet"
            />
            <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-aura-emerald/20 bg-aura-emerald/10 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-[#047857]">
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                  Etika & privasi
                </span>
                <h3 className="mt-4 text-balance font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
                  AI menyusun draf, guru memutuskan sebelum materi dibagikan.
                </h3>
                <p className="mt-3 font-body text-[15px] leading-[26px] text-aura-muted">
                  Guru Pintar menjaga batas yang jelas: data pribadi tidak dikirim ke model AI, label kelompok tidak
                  ditampilkan ke siswa, dan setiap materi diperiksa guru.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                    <CircleCheck aria-hidden="true" className="size-4 text-aura-emerald" />
                    Data siswa tidak dikirim ke AI
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                    <ShieldCheck aria-hidden="true" className="size-4 text-aura-primary" />
                    Diperiksa guru
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {PRINSIP.map((p) => (
                  <li key={p} className="flex gap-3 rounded-2xl border border-white/60 bg-white/45 p-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-aura-emerald/10 text-aura-emerald">
                      <CircleCheck aria-hidden="true" className="size-3.5" />
                    </span>
                    <span className="font-body text-[14px] leading-[22px] text-aura-ink">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="judul-penutup"
          data-latar="primer"
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-aura-primary via-aura-primary-deep to-aura-indigo p-7 text-white shadow-[0_24px_60px_-24px_rgba(37,99,235,0.65)] md:p-12"
        >
          <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-10 size-64 rounded-full bg-aura-violet/30 blur-3xl" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 1px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "28px 28px, 36px 36px",
            }}
          />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-white/90">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Mulai dari satu kelas
              </span>
              <h2
                id="judul-penutup"
                className="mt-4 text-balance font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] md:text-[34px] md:leading-[42px]"
              >
                Coba satu siklus dalam lima menit
              </h2>
              <p className="mt-3 font-body text-[15px] leading-[26px] text-white/80">
                Buka kuis, lihat peta kelas, lalu bagikan materi lanjutan. Akun guru dan siswa terpisah, tanpa instal.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-display text-[12px] font-semibold text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <CircleCheck aria-hidden="true" className="size-3.5" />
                  5 soal per kuis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CircleCheck aria-hidden="true" className="size-3.5" />
                  Siap dari HP
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  Hasil langsung
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col lg:flex-row">
              <Link href="/masuk" className="aura-btn aura-btn-light h-[52px] w-full px-6 text-[15px] sm:w-auto">
                Mulai sekarang
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/daftar/guru" className="aura-btn aura-btn-ghost-light h-[52px] w-full px-6 text-[15px] sm:w-auto">
                Daftar guru
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-4 border-t border-aura-outline/50 px-4 py-8 font-body text-[13px] leading-[18px] text-aura-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <TulisanGuruPintar className="h-4 w-auto" />
          <span aria-hidden="true">·</span>
          <span>Prototipe hackathon</span>
        </div>
        <nav aria-label="Tautan footer" className="flex flex-wrap items-center gap-x-4">
          <Link href="/masuk" className="inline-flex min-h-12 items-center transition-colors hover:text-aura-primary">
            Masuk
          </Link>
          <Link href="/daftar/guru" className="inline-flex min-h-12 items-center transition-colors hover:text-aura-primary">
            Daftar guru
          </Link>
          <a href="#atas" className="inline-flex min-h-12 items-center transition-colors hover:text-aura-primary">
            Kembali ke atas
          </a>
        </nav>
      </footer>
    </div>
  );
}
