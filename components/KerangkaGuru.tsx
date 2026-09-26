"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, HeartHandshake, LayoutDashboard, type LucideIcon } from "lucide-react";

type KerangkaGuruProps = {
  children: ReactNode;
};

type Menu = { href: string; label: string; ikon: LucideIcon; aktif: (path: string) => boolean };

const MENU: Menu[] = [
  {
    href: "/guru",
    label: "Dashboard",
    ikon: LayoutDashboard,
    aktif: (path) => !path.startsWith("/guru/pendampingan"),
  },
  {
    href: "/guru/pendampingan",
    label: "Perlu Pendampingan",
    ikon: HeartHandshake,
    aktif: (path) => path.startsWith("/guru/pendampingan"),
  },
];

/**
 * Kerangka semua halaman guru (design.md 3.1, 3.7): sidebar penuh 248px di ≥1280px,
 * hanya ikon 72px di 768–1279px, dan bar atas di bawah 768px.
 */
export function KerangkaGuru({ children }: KerangkaGuruProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="kaca sticky top-0 z-10 m-3 flex shrink-0 flex-row items-center gap-3 p-3 md:m-4 md:h-[calc(100vh-2rem)] md:w-[72px] md:flex-col md:items-stretch xl:w-[248px] xl:p-4">
        <Link href="/" className="flex min-h-12 items-center gap-2 px-2 font-bold md:justify-center xl:justify-start">
          <GraduationCap aria-hidden="true" className="size-6 shrink-0 text-primer" />
          <span className="md:sr-only xl:not-sr-only">Guru Pintar</span>
        </Link>

        <nav aria-label="Menu guru" className="flex-1">
          <ul className="flex flex-row gap-2 md:flex-col">
            {MENU.map(({ href, label, ikon: Ikon, aktif }) => {
              const sedangAktif = aktif(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={label}
                    aria-current={sedangAktif ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-full px-3 text-[15px] font-semibold transition-colors md:justify-center xl:justify-start xl:px-4 ${
                      sedangAktif ? "bg-primer text-white" : "text-tinta-lembut hover:bg-primer-lembut hover:text-primer"
                    }`}
                  >
                    <Ikon aria-hidden="true" className="size-5 shrink-0" />
                    <span className="sr-only sm:not-sr-only md:sr-only xl:not-sr-only">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden flex-col px-2 xl:flex">
          <span className="text-[15px] font-semibold">Kelas 7A</span>
          <span className="text-[13px] leading-normal font-medium text-tinta-lembut">Bu Rina</span>
        </div>
      </aside>

      <main className="w-full max-w-[1200px] flex-1 px-4 py-6 text-[15px] leading-relaxed md:p-8">{children}</main>
    </div>
  );
}
