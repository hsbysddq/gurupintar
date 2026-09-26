import Link from "next/link";
import { Presentation, Smartphone, type LucideIcon } from "lucide-react";

const PILIHAN: { href: string; judul: string; keterangan: string; ikon: LucideIcon }[] = [
  {
    href: "/guru",
    judul: "Saya guru",
    keterangan: "Buka kuis, lihat hasil kelas, dan bagikan materi lanjutan.",
    ikon: Presentation,
  },
  {
    href: "/siswa",
    judul: "Saya siswa",
    keterangan: "Masukkan kode kelas dari gurumu, lalu kerjakan kuisnya.",
    ikon: Smartphone,
  },
];

export default function Beranda() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="text-center">
        <h1 className="text-[28px] leading-tight font-bold">Guru Pintar</h1>
        <p className="mx-auto mt-2 max-w-prose text-[15px] leading-relaxed text-tinta-lembut">
          Cek pemahaman kilat untuk kelas, materi lanjutan untuk setiap siswa.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {PILIHAN.map(({ href, judul, keterangan, ikon: Ikon }) => (
          <Link
            key={href}
            href={href}
            className="kaca flex min-h-12 flex-col gap-3 p-6 transition-shadow hover:shadow-lg"
          >
            <span className="flex size-12 items-center justify-center rounded-kecil bg-primer-lembut text-primer">
              <Ikon aria-hidden="true" className="size-6" />
            </span>
            <span className="text-xl leading-snug font-semibold">{judul}</span>
            <span className="text-[15px] leading-relaxed text-tinta-lembut">{keterangan}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
