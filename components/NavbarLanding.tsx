import Link from "next/link";
import { Menu } from "lucide-react";
import { TulisanGuruPintar } from "@/components/LogoGuruPintar";

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
        className="aura-glass-strong relative mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full px-3 sm:px-4"
      >
        <Link href="/" aria-label="Guru Pintarku, ke beranda" className="flex min-h-12 items-center gap-2.5 rounded-full">
          <TulisanGuruPintar className="h-4 w-auto shrink-0 sm:h-5" />
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
          <details className="relative md:hidden">
            <summary
              aria-label="Menu navigasi"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-aura-muted transition-colors hover:bg-white/65 hover:text-aura-primary [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </summary>
            <div className="absolute top-[calc(100%+0.6rem)] right-0 z-40 w-56 rounded-[20px] border border-white/70 bg-white/90 p-2 shadow-[0_18px_40px_-20px_rgba(31,38,135,0.35)] backdrop-blur-xl">
              <ul className="flex flex-col">
                {TAUTAN.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="flex min-h-11 items-center rounded-xl px-3 font-display text-[13px] font-semibold text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
              <Link
                href="/masuk"
                className="mt-1 flex min-h-11 items-center rounded-xl border-t border-white/60 px-3 font-display text-[13px] font-semibold text-aura-primary hover:bg-aura-primary/5"
              >
                Masuk
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
