import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Tombol } from "@/components/Tombol";

const TAUTAN: { href: string; label: string }[] = [
  { href: "#masalah", label: "Masalah" },
  { href: "#cara-kerja", label: "Cara kerja" },
];

/**
 * Navbar kapsul kaca untuk landing page (design.md 4.19). Server Component tanpa JavaScript:
 * di bawah 768px tautan tengah disembunyikan, tanpa menu hamburger.
 */
export function NavbarLanding() {
  return (
    <header className="sticky top-3 z-20 mx-3 md:mx-6">
      <nav
        aria-label="Navigasi utama"
        className="kaca mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full py-2 pr-2 pl-4 md:pl-5"
      >
        <Link href="/" aria-label="Guru Pintar, ke beranda" className="flex min-h-12 items-center gap-2 rounded-full font-bold">
          <GraduationCap aria-hidden="true" className="size-6 shrink-0 text-primer" />
          <span aria-hidden="true" className="max-sm:sr-only">
            Guru Pintar
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {TAUTAN.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="flex min-h-12 items-center rounded-full px-3 text-[15px] font-semibold text-tinta-lembut transition-colors hover:bg-primer-lembut hover:text-primer-hover"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <span className="max-sm:hidden">
            <Tombol varian="teks" href="/siswa">
              Gabung kuis
            </Tombol>
          </span>
          <Tombol varian="sekunder" href="/guru">
            Coba sebagai guru
          </Tombol>
        </div>
      </nav>
    </header>
  );
}
