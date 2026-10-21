import type { Metadata } from "next";
import {
  CircleCheck,
  FileText,
  Headphones,
  HeartHandshake,
  Lightbulb,
  ListChecks,
  Pencil,
  PlayCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { NavbarLanding } from "@/components/NavbarLanding";
import { PratinjauDasbor } from "@/components/PratinjauDasbor";
import { Tombol } from "@/components/Tombol";

export const metadata: Metadata = {
  title: "Guru Pintar: tahu siapa yang tertinggal hari ini",
  description:
    "Cek pemahaman kilat 5 soal dari HP siswa, peta kelas dalam hitungan menit, dan materi lanjutan per kelompok yang dibuat dengan bantuan AI lalu diperiksa guru.",
};

const KEUNGGULAN = ["Kuis 5 soal", "Tanpa instal", "Hasil dalam 3 detik"];

const MASALAH: { angka: string; satuan: string; keterangan: string }[] = [
  { angka: "40", satuan: "siswa", keterangan: "dalam satu kelas" },
  { angka: "80", satuan: "menit", keterangan: "dua jam pelajaran" },
  { angka: "2", satuan: "menit per anak", keterangan: "jika waktunya dibagi rata" },
];

const LANGKAH: { judul: string; isi: string }[] = [
  {
    judul: "Cek",
    isi: "Buka kuis 5 soal. Siswa bergabung dari HP dengan kode kelas atau QR dan menjawab dalam beberapa menit.",
  },
  {
    judul: "Petakan",
    isi: "Jawaban langsung terpetakan menjadi tiga kelompok, lengkap dengan soal yang paling banyak salah.",
  },
  {
    judul: "Tindak lanjut",
    isi: "AI menyusun materi lanjutan untuk tiap kelompok. Guru memeriksa dan menyesuaikannya, lalu membagikannya.",
  },
];

// Ikon sama dengan tab di TabMateriSiswa.
const BENTUK_MATERI: { label: string; ikon: LucideIcon }[] = [
  { label: "Video", ikon: PlayCircle },
  { label: "Audio", ikon: Headphones },
  { label: "Bacaan", ikon: FileText },
  { label: "Latihan", ikon: Pencil },
];

// Kotak bento kecil; peta kelas dan materi AI ditulis terpisah karena isinya berbeda.
const FITUR_KECIL: { judul: string; isi: string; ikon: LucideIcon; kelas: string }[] = [
  {
    judul: "Soal paling banyak salah",
    isi: "Lengkap dengan kesalahan pemahaman yang paling sering muncul, jadi guru tahu apa yang perlu diluruskan.",
    ikon: Lightbulb,
    kelas: "",
  },
  {
    judul: "Perlu Pendampingan",
    isi: "Siswa yang berulang kali tertinggal, tidak mengerjakan, atau skornya terus turun ditandai beserta saran tindakan.",
    ikon: HeartHandshake,
    kelas: "",
  },
  {
    judul: "Ubah Modul",
    isi: "Tempelkan teks modul matematika kelas 7, lalu lihat pratinjaunya dalam empat bentuk belajar.",
    ikon: FileText,
    kelas: "lg:col-span-2",
  },
  {
    judul: "Buat soal sendiri",
    isi: "Susun topik dengan 5 soal pilihan ganda beserta kesalahan pemahaman tiap pilihan, lalu pakai untuk kuis berikutnya.",
    ikon: ListChecks,
    kelas: "lg:col-span-2",
  },
];

const PRINSIP = [
  "Materi AI selalu berupa draf sampai guru memeriksanya dan menekan Bagikan ke Siswa.",
  "Guru Pintar tidak mengirim nama atau data siswa ke AI.",
  "Siswa tidak pernah melihat label kelompoknya. Yang mereka lihat hanya Materi untukmu.",
  "Pilihan bentuk materi hanya preferensi siswa yang bisa diganti kapan saja, bukan diagnosis gaya belajar.",
];

// Proporsi bilah di kotak peta kelas, sama dengan PratinjauDasbor (RIW004).
const BILAH_KELOMPOK = [
  { label: "Belum", jumlah: 16, kelas: "bg-belum grow-[16]" },
  { label: "Setengah", jumlah: 12, kelas: "bg-setengah grow-[12]" },
  { label: "Sudah", jumlah: 10, kelas: "bg-sudah grow-[10]" },
];

const JUDUL_BAGIAN = "text-[28px] leading-tight font-bold tracking-tight md:text-[32px]";
const LABEL_BAGIAN = "text-[13px] leading-normal font-semibold text-primer-hover";
const IKON_KOTAK = "flex size-10 items-center justify-center rounded-kecil bg-primer-lembut text-primer-hover";

// design.md 3.10. Server Component tanpa data dari database.
export default function Beranda() {
  return (
    <div className="flex flex-1 flex-col">
      <NavbarLanding />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-24 overflow-x-clip px-4 pt-12 pb-16 text-[15px] leading-relaxed md:px-8 md:pt-16">
        {/* Hero: satu-satunya tombol varian utama di layar pertama; navbar memakai sekunder. */}
        <section
          id="atas"
          aria-labelledby="judul-hero"
          className="grid scroll-mt-28 items-center gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-12"
        >
          <div className="flex flex-col items-start gap-6">
            <p className="rounded-full bg-primer-lembut px-3 py-1 text-[13px] leading-normal font-semibold text-primer-hover">
              Untuk guru SMP · Kurikulum Merdeka
            </p>
            <h1 id="judul-hero" className="text-[36px] leading-[1.1] font-extrabold tracking-tight lg:text-[56px] lg:leading-[1.05]">
              Tahu siapa yang tertinggal <span className="text-primer">hari ini</span>, bukan saat ulangan.
            </h1>
            <p className="max-w-prose text-base leading-relaxed text-tinta-lembut md:text-lg">
              Cek pemahaman kilat 5 soal dari HP siswa, lalu materi lanjutan untuk tiap kelompok disusun dengan bantuan AI
              dan diperiksa guru.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Tombol varian="utama" href="/masuk">
                Masuk sebagai guru
              </Tombol>
              <Tombol varian="sekunder" href="/masuk">
                Masuk sebagai siswa
              </Tombol>
            </div>
            <ul className="flex flex-wrap gap-2">
              {KEUNGGULAN.map((k) => (
                <li
                  key={k}
                  className="kaca inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] leading-normal font-semibold"
                >
                  <CircleCheck aria-hidden="true" className="size-4 text-sudah-teks" />
                  {k}
                </li>
              ))}
            </ul>
          </div>
          <PratinjauDasbor />
        </section>

        <section id="masalah" aria-labelledby="judul-masalah" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className={LABEL_BAGIAN}>Masalah</p>
            <h2 id="judul-masalah" className={JUDUL_BAGIAN}>
              Satu guru tidak bisa menanyai 40 anak satu per satu
            </h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            {MASALAH.map(({ angka, satuan, keterangan }) => (
              <KartuKaca key={satuan} className="flex flex-col gap-1 p-6">
                <dt className="order-2 text-tinta-lembut">{keterangan}</dt>
                <dd className="order-1 flex items-baseline gap-2">
                  <span className="text-[40px] leading-[1.1] font-extrabold tracking-tight md:text-[48px]">{angka}</span>
                  <span className="text-base font-semibold">{satuan}</span>
                </dd>
              </KartuKaca>
            ))}
          </dl>
          <p className="max-w-prose text-base">
            Waktunya tidak cukup untuk memastikan setiap anak paham. Siswa yang tertinggal berada di zona buta, dan sering
            baru terlihat saat ulangan, ketika kesenjangannya sudah lebar dan semangatnya sudah turun.
          </p>
        </section>

        <section id="cara-kerja" aria-labelledby="judul-cara" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className={LABEL_BAGIAN}>Cara kerja</p>
            <h2 id="judul-cara" className={JUDUL_BAGIAN}>
              Cara kerjanya
            </h2>
          </div>
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            {/* Garis penghubung di belakang lingkaran nomor, hanya di desktop. */}
            <span aria-hidden="true" className="absolute top-6 right-[16%] left-[16%] hidden h-0.5 bg-primer/20 md:block" />
            {LANGKAH.map(({ judul, isi }, i) => (
              <li key={judul} className="relative flex flex-col gap-3 md:items-center md:text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primer text-lg font-bold text-white ring-8 ring-latar">
                  {i + 1}
                </span>
                <h3 className="text-xl leading-snug font-semibold">{judul}</h3>
                <p className="max-w-xs text-tinta-lembut">{isi}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="fitur" aria-labelledby="judul-fitur" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className={LABEL_BAGIAN}>Fitur</p>
            <h2 id="judul-fitur" className={JUDUL_BAGIAN}>
              Yang bisa dilakukan guru
            </h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <li className="md:col-span-2 lg:row-span-2">
              <KartuKaca className="flex h-full flex-col gap-4 p-6 md:p-8">
                <span className={IKON_KOTAK}>
                  <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
                    <span className="size-2 rounded-full bg-belum" />
                    <span className="size-2 rounded-full bg-setengah" />
                    <span className="size-2 rounded-full bg-sudah" />
                    <span className="size-2 rounded-full bg-tinta/15" />
                  </span>
                </span>
                <h3 className="text-xl leading-snug font-semibold">Peta kelas</h3>
                <p className="max-w-prose text-tinta-lembut">
                  Siapa yang sudah, setengah, dan belum paham terlihat dalam satu layar, bukan di tumpukan kertas.
                </p>
                <div className="mt-auto flex flex-col gap-3 pt-4">
                  <div
                    role="img"
                    aria-label="Contoh: 16 belum paham, 12 setengah paham, 10 sudah paham."
                    className="flex h-4 gap-1 overflow-hidden rounded-full"
                  >
                    {BILAH_KELOMPOK.map((b) => (
                      <span key={b.label} className={`basis-0 ${b.kelas}`} />
                    ))}
                  </div>
                  <p aria-hidden="true" className="flex flex-wrap gap-x-4 text-[13px] leading-normal font-medium">
                    {BILAH_KELOMPOK.map((b) => (
                      <span key={b.label}>
                        <span className="font-bold">{b.jumlah}</span> {b.label}
                      </span>
                    ))}
                  </p>
                </div>
              </KartuKaca>
            </li>

            <li className="md:col-span-2">
              <KartuKaca className="flex h-full flex-col gap-4 p-6">
                <span className={IKON_KOTAK}>
                  <Sparkles aria-hidden="true" className="size-5 text-ai" />
                </span>
                <h3 className="text-xl leading-snug font-semibold">Materi AI dalam 4 bentuk</h3>
                <p className="text-tinta-lembut">
                  Satu materi untuk tiap kelompok. Siswa membukanya dalam bentuk yang mereka pilih.
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BENTUK_MATERI.map(({ label, ikon: Ikon }) => (
                    <li
                      key={label}
                      className="flex flex-col items-center gap-1 rounded-kecil bg-primer-lembut px-2 py-3 text-[13px] leading-normal font-semibold text-primer-hover"
                    >
                      <Ikon aria-hidden="true" className="size-5" />
                      {label}
                    </li>
                  ))}
                </ul>
              </KartuKaca>
            </li>

            {FITUR_KECIL.map(({ judul, isi, ikon: Ikon, kelas }) => (
              <li key={judul} className={kelas}>
                <KartuKaca className="flex h-full flex-col gap-3 p-6">
                  <span className={IKON_KOTAK}>
                    <Ikon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="text-base leading-snug font-semibold">{judul}</h3>
                  <p className="text-tinta-lembut">{isi}</p>
                </KartuKaca>
              </li>
            ))}
          </ul>
        </section>

        <section id="prinsip" aria-labelledby="judul-prinsip" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className={LABEL_BAGIAN}>Prinsip</p>
            <h2 id="judul-prinsip" className={JUDUL_BAGIAN}>
              Prinsip yang kami pegang
            </h2>
          </div>
          <KartuKaca className="p-6 md:p-8">
            <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {PRINSIP.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sudah-teks" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </KartuKaca>
        </section>

        {/* Pita penutup: aksi utama layar ini memakai varian terang di atas latar primer. */}
        <section
          aria-labelledby="judul-penutup"
          data-latar="primer"
          className="flex flex-col items-start gap-6 rounded-kartu bg-primer p-8 text-white md:flex-row md:items-center md:justify-between md:p-12"
        >
          <div className="flex flex-col gap-2">
            <h2 id="judul-penutup" className="text-[28px] leading-tight font-bold tracking-tight md:text-[32px]">
              Coba satu siklus dalam lima menit
            </h2>
            <p className="max-w-prose text-base">Buka kuis, lihat peta kelas, lalu bagikan materi lanjutan. Akun guru dan siswa terpisah.</p>
          </div>
          <Tombol varian="terang" href="/masuk">
            Mulai sekarang
          </Tombol>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-tinta/10 px-4 py-6 text-[13px] leading-normal font-medium text-tinta-lembut md:px-8">
        <span>Prototipe hackathon. Guru Pintar.</span>
        <a href="#atas" className="inline-flex min-h-12 items-center hover:text-tinta">
          Kembali ke atas
        </a>
      </footer>
    </div>
  );
}
