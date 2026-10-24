'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, LayoutDashboard, ChartLine, type LucideIcon } from 'lucide-react';

type Menu = { href: string; label: string; ikon: LucideIcon; aktif: (path: string) => boolean };

const MENU: Menu[] = [
  {
    href: '/siswa',
    label: 'Beranda',
    ikon: LayoutDashboard,
    aktif: (path) => path === '/siswa',
  },
  {
    href: '/siswa/kelas',
    label: 'Mata Pelajaran',
    ikon: BookOpen,
    aktif: (path) => path.startsWith('/siswa/kelas'),
  },
  {
    href: '/siswa/gabung',
    label: 'Kuis & Latihan',
    ikon: ClipboardList,
    aktif: (path) => path.startsWith('/siswa/gabung'),
  },
  {
    href: '/siswa/performa',
    label: 'Hasil Belajar',
    ikon: ChartLine,
    aktif: (path) => path.startsWith('/siswa/performa'),
  },
];

/** Menu sidebar siswa. Gayanya sama dengan NavigasiGuru. */
export function NavigasiSiswa() {
  const pathname = usePathname();

  return (
    <ul className="flex w-full flex-row justify-around gap-1 md:w-full md:flex-col md:justify-start md:gap-1.5">
      {MENU.map(({ href, label, ikon: Ikon, aktif }) => {
        const sedangAktif = aktif(pathname);
        return (
          <li key={href} className="min-w-0 flex-1 md:w-full md:flex-none">
            <Link
              href={href}
              title={label}
              aria-current={sedangAktif ? 'page' : undefined}
              className={`group flex min-h-12 min-w-11 w-full items-center justify-center gap-0 rounded-2xl px-1 text-[15px] font-semibold transition-all duration-200 md:rounded-xl xl:justify-start xl:gap-3 xl:rounded-2xl xl:px-3 ${
                sedangAktif
                  ? 'bg-gradient-to-r from-aura-primary to-aura-primary-deep text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)]'
                  : 'text-aura-muted hover:bg-white/70 hover:text-aura-primary'
              }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  sedangAktif
                    ? 'bg-white/20 text-white'
                    : 'bg-white/60 text-aura-muted ring-1 ring-white/70 group-hover:bg-aura-primary/10 group-hover:text-aura-primary'
                }`}
              >
                <Ikon aria-hidden="true" className="size-5" />
              </span>
              <span className="sr-only xl:not-sr-only">{label}</span>
              {sedangAktif && (
                <span
                  aria-hidden="true"
                  className="ml-auto hidden size-2 rounded-full bg-white shadow-sm ring-4 ring-white/25 xl:block"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
