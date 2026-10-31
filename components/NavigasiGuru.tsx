'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  ChevronDown,
  FileText,
  LayoutDashboard,
  ListChecks,
  School,
  type LucideIcon,
} from 'lucide-react';

export type KelasNav = { id: string; nama: string };

type Menu = { href: string; label: string; ikon: LucideIcon; aktif: (path: string) => boolean };

/** Menu guru + pemilih kelas. Dipisah agar useSearchParams punya batas Suspense sendiri. */
export function NavigasiGuru({ kelas }: { kelas: KelasNav[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const kelasAktif = params.get('kelas') ?? '';
  const kelasTerpilih = kelas.find((k) => k.id === kelasAktif) ?? null;

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
      href: '/guru/ringkasan',
      label: 'Ringkasan',
      ikon: BarChart3,
      aktif: (path) => path === '/guru/ringkasan',
    },
    {
      href: '/guru/soal',
      label: 'Bank Soal',
      ikon: ListChecks,
      aktif: (path) => path.startsWith('/guru/soal'),
    },
    {
      href: '/guru/modul',
      label: 'Ubah Modul',
      ikon: FileText,
      aktif: (path) => path.startsWith('/guru/modul'),
    },
  ];

  function pilihKelas(id: string) {
    if (!id) return;
    const tujuan = pathname.startsWith('/guru/pendampingan') ? '/guru/pendampingan' : '/guru/kelas';
    router.push(`${tujuan}?kelas=${encodeURIComponent(id)}`);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {kelas.length > 0 && (
        <div className="hidden flex-col gap-1.5 xl:flex">
          <div className="flex items-center justify-between gap-2 px-1">
            <label
              htmlFor="pilih-kelas-sidebar"
              className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
            >
              Kelas aktif
            </label>
            <span className="font-body text-[11px] leading-[16px] text-aura-muted">{kelas.length} kelas</span>
          </div>

          <div className="relative rounded-2xl border border-aura-primary/15 bg-gradient-to-br from-aura-primary/10 to-aura-violet/10 shadow-[0_4px_16px_-4px_rgba(37,99,235,0.12)] transition-colors hover:border-aura-primary/30 focus-within:ring-[3px] focus-within:ring-aura-primary/30">
            <div aria-hidden="true" className="pointer-events-none flex items-center gap-3 p-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-aura-primary shadow-sm ring-1 ring-aura-primary/10">
                <School className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[14px] leading-[20px] font-bold text-aura-ink">
                  {kelasTerpilih?.nama ?? 'Pilih kelas'}
                </p>
                <p className="font-body text-[11px] leading-[16px] font-medium text-aura-muted">
                  {kelasTerpilih ? 'Kelas aktif saat ini' : `${kelas.length} kelas terdaftar`}
                </p>
              </div>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-aura-muted" />
            </div>
            <select
              id="pilih-kelas-sidebar"
              value={kelasTerpilih ? kelasAktif : ''}
              onChange={(e) => pilihKelas(e.target.value)}
              className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
            >
              <option value="">Pilih kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {kelas.length > 0 && (
        <div className="relative hidden md:block xl:hidden">
          <label htmlFor="pilih-kelas-rail" className="sr-only">
            Kelas aktif
          </label>
          <div
            title={kelasTerpilih?.nama ?? 'Pilih kelas'}
            className="relative flex h-12 items-center justify-center rounded-xl border border-aura-primary/15 bg-gradient-to-br from-aura-primary/10 to-aura-violet/10 text-aura-primary shadow-sm"
          >
            <School aria-hidden="true" className="size-5" />
            {kelasTerpilih && (
              <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-aura-primary ring-2 ring-white" />
            )}
            <select
              id="pilih-kelas-rail"
              value={kelasTerpilih ? kelasAktif : ''}
              onChange={(e) => pilihKelas(e.target.value)}
              className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
            >
              <option value="">Pilih kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <ul className="flex w-full flex-row justify-around gap-1 md:w-full md:flex-col md:justify-start md:gap-1.5">
        {menu.map(({ href, label, ikon: Ikon, aktif }) => {
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
    </div>
  );
}
