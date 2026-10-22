'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabKelas({ kelasId }: { kelasId: string }) {
  const pathname = usePathname();
  const tab = [
    {
      href: `/guru/kelas?kelas=${kelasId}`,
      label: 'Kuis',
      aktif:
        pathname === '/guru/kelas' || pathname.startsWith('/guru/hasil') || pathname === '/guru/materi',
    },
    {
      href: `/guru/kelas/materi?kelas=${kelasId}`,
      label: 'Materi',
      aktif: pathname.startsWith('/guru/kelas/materi'),
    },
    {
      href: `/guru/kelas/siswa?kelas=${kelasId}`,
      label: 'Siswa',
      aktif: pathname.startsWith('/guru/kelas/siswa'),
    },
    {
      href: `/guru/pendampingan?kelas=${kelasId}`,
      label: 'Pendampingan',
      aktif: pathname.startsWith('/guru/pendampingan'),
    },
    {
      href: `/guru/kelas/pengaturan?kelas=${kelasId}`,
      label: 'Pengaturan',
      aktif: pathname.startsWith('/guru/kelas/pengaturan'),
    },
  ];

  return (
    <nav aria-label="Bagian kelas" className="aura-glass rounded-[24px] p-1 md:rounded-full">
      <ul className="flex flex-wrap gap-1 md:flex-nowrap md:overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tab.map(({ href, label, aktif }) => (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={aktif ? 'page' : undefined}
              className={`inline-flex min-h-12 items-center rounded-full px-3.5 font-display text-[13px] font-semibold transition-colors sm:px-4 sm:text-[14px] ${
                aktif
                  ? 'bg-gradient-to-r from-aura-primary to-aura-primary-deep text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]'
                  : 'text-aura-muted hover:bg-white/60 hover:text-aura-primary'
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
