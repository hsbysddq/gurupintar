'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, LayoutDashboard, ChartLine, type LucideIcon } from 'lucide-react';

type Menu = {
  href: string;
  label: string;
  labelPendek: string;
  ikon: LucideIcon;
  aktif: (path: string) => boolean;
};

const MENU: Menu[] = [
  {
    href: '/siswa',
    label: 'Beranda',
    labelPendek: 'Beranda',
    ikon: LayoutDashboard,
    aktif: (path) => path === '/siswa',
  },
  {
    href: '/siswa/kelas',
    label: 'Mata Pelajaran',
    labelPendek: 'Mapel',
    ikon: BookOpen,
    aktif: (path) => path.startsWith('/siswa/kelas'),
  },
  {
    href: '/siswa/gabung',
    label: 'Kuis & Latihan',
    labelPendek: 'Kuis',
    ikon: ClipboardList,
    aktif: (path) => path.startsWith('/siswa/gabung'),
  },
  {
    href: '/siswa/performa',
    label: 'Performa',
    labelPendek: 'Performa',
    ikon: ChartLine,
    aktif: (path) => path.startsWith('/siswa/performa'),
  },
];

/**
 * Menu navigasi siswa.
 * - tampilan "sisi": sidebar (ikon saja di 768–1279px, ikon + teks di ≥1280px). Gayanya sama dengan NavigasiGuru.
 * - tampilan "bawah": bilah tab di dasar layar untuk ponsel (<768px), ikon di atas label.
 */
export function NavigasiSiswa({ tampilan = 'sisi' }: { tampilan?: 'sisi' | 'bawah' }) {
  const pathname = usePathname();

  if (tampilan === 'bawah') {
    return (
      <ul className="grid grid-cols-4 gap-1">
        {MENU.map(({ href, label, labelPendek, ikon: Ikon, aktif }) => {
          const sedangAktif = aktif(pathname);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-label={label}
                aria-current={sedangAktif ? 'page' : undefined}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] leading-tight font-semibold transition-colors ${
                  sedangAktif
                    ? 'bg-gradient-to-r from-aura-primary to-aura-primary-deep text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)]'
                    : 'text-aura-muted active:bg-white/70'
                }`}
              >
                <Ikon aria-hidden="true" className="size-5 shrink-0" />
                <span className="max-w-full truncate">{labelPendek}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-1.5">
      {MENU.map(({ href, label, ikon: Ikon, aktif }) => {
        const sedangAktif = aktif(pathname);
        return (
          <li key={href} className="w-full">
            <Link
              href={href}
              title={label}
              aria-current={sedangAktif ? 'page' : undefined}
              className={`group flex min-h-12 w-full items-center justify-center gap-0 rounded-xl px-1 text-[15px] font-semibold transition-all duration-200 xl:justify-start xl:gap-3 xl:rounded-2xl xl:px-3 ${
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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
