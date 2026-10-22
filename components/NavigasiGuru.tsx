'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FileText, HeartHandshake, LayoutDashboard, ListChecks, type LucideIcon } from 'lucide-react';

export type KelasNav = { id: string; nama: string };

type Menu = { href: string; label: string; ikon: LucideIcon; aktif: (path: string) => boolean };

/** Menu guru + pemilih kelas. Dipisah agar useSearchParams punya batas Suspense sendiri. */
export function NavigasiGuru({ kelas }: { kelas: KelasNav[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const kelasAktif = params.get('kelas') ?? '';

  const menu: Menu[] = [
    {
      href: '/guru',
      label: 'Kelas',
      ikon: LayoutDashboard,
      aktif: (path) =>
        path === '/guru' ||
        path.startsWith('/guru/kelas') ||
        path.startsWith('/guru/hasil') ||
        path.startsWith('/guru/materi'),
    },
    {
      href: '/guru/soal',
      label: 'Buat Soal',
      ikon: ListChecks,
      aktif: (path) => path.startsWith('/guru/soal'),
    },
    {
      href: '/guru/modul',
      label: 'Ubah Modul',
      ikon: FileText,
      aktif: (path) => path.startsWith('/guru/modul'),
    },
    {
      href: `/guru/pendampingan${kelasAktif ? `?kelas=${encodeURIComponent(kelasAktif)}` : ''}`,
      label: 'Perlu Pendampingan',
      ikon: HeartHandshake,
      aktif: (path) => path.startsWith('/guru/pendampingan'),
    },
  ];

  function pilihKelas(id: string) {
    if (!id) return;
    const tujuan = pathname.startsWith('/guru/pendampingan') ? '/guru/pendampingan' : '/guru/kelas';
    router.push(`${tujuan}?kelas=${encodeURIComponent(id)}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {kelas.length > 0 && (
        <div className="hidden flex-col gap-1 px-1 xl:flex">
          <label htmlFor="pilih-kelas-sidebar" className="text-[12px] leading-normal font-medium text-tinta-lembut">
            Kelas aktif
          </label>
          <select
            id="pilih-kelas-sidebar"
            value={kelas.some((k) => k.id === kelasAktif) ? kelasAktif : ''}
            onChange={(e) => pilihKelas(e.target.value)}
            className="h-10 w-full rounded-kecil border border-tinta/15 bg-white/80 px-2 text-[14px] font-semibold text-tinta"
          >
            <option value="">Pilih kelas</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul className="flex flex-row gap-2 md:flex-col">
        {menu.map(({ href, label, ikon: Ikon, aktif }) => {
          const sedangAktif = aktif(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                title={label}
                aria-current={sedangAktif ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-full px-3 text-[15px] font-semibold transition-colors md:justify-center xl:justify-start xl:px-4 ${
                  sedangAktif ? 'bg-primer text-white' : 'text-tinta-lembut hover:bg-primer-lembut hover:text-primer'
                }`}
              >
                <Ikon aria-hidden="true" className="size-5 shrink-0" />
                <span className="sr-only sm:not-sr-only md:sr-only xl:not-sr-only">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
