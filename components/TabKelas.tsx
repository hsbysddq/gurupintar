'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabKelas({ kelasId }: { kelasId: string }) {
  const pathname = usePathname();
  const tab = [
    {
      href: `/guru/kelas?kelas=${kelasId}`,
      label: 'Kuis',
      aktif: pathname === '/guru/kelas',
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
    <nav aria-label="Bagian kelas">
      <ul className="flex flex-wrap gap-2">
        {tab.map(({ href, label, aktif }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={aktif ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-semibold transition-colors ${
                aktif ? 'bg-primer text-white' : 'bg-white/70 text-tinta-lembut hover:bg-primer-lembut hover:text-primer'
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
