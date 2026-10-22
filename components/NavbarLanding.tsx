import Link from "next/link";
import { GraduationCap } from "lucide-react";

const TAUTAN: { href: string; label: string }[] = [
  { href: "#masalah", label: "Masalah" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#prinsip", label: "Prinsip" },
];

/** Navigasi kapsul kaca untuk landing page Aura Docent. */
export function NavbarLanding() {
  return (
    <header className="sticky top-3 z-30 mx-3 md:mx-6">
      <nav
        aria-label="Navigasi utama"
        className="aura-glass-strong mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full px-3 sm:px-4"
      >
        <Link href="/" aria-label="Guru Pintar, ke beranda" className="flex min-h-12 items-center gap-2.5 rounded-full">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary to-aura-indigo text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.55)]">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-aura-ink">Guru Pintar</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {TAUTAN.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="flex min-h-12 items-center rounded-full px-3 font-display text-[14px] font-semibold text-aura-muted transition-colors hover:bg-white/65 hover:text-aura-primary"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/masuk"
            className="hidden min-h-12 items-center rounded-full px-3 font-display text-[14px] font-semibold text-aura-muted transition-colors hover:bg-white/65 hover:text-aura-primary sm:flex"
          >
            Masuk
          </Link>
          <Link href="/daftar/guru" className="aura-btn aura-btn-primary h-12 px-4 text-[13px]">
            Daftar guru
          </Link>
        </div>
      </nav>
    </header>
  );
}
