'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, LogOut } from 'lucide-react';
import { TulisanGuruPintar } from '@/components/LogoGuruPintar';
import { keluar } from '@/lib/api-klien';

const MENU = [
  { href: '/super-admin', label: 'Sekolah', ikon: Building2 },
  { href: '/super-admin/admin', label: 'Admin', ikon: LayoutDashboard },
];

export function KerangkaSuperAdmin({ children, nama }: { children: ReactNode; nama: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function keluarAkun() {
    await keluar().catch(() => {});
    router.replace('/masuk');
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="aura-glass m-3 flex shrink-0 flex-row items-center gap-2 rounded-[24px] p-2 md:h-[calc(100vh-1.5rem)] md:w-[240px] md:flex-col md:items-stretch md:p-4">
        <Link href="/super-admin" className="flex min-h-12 items-center gap-2 px-1">
          <TulisanGuruPintar className="h-5 w-auto" />
        </Link>
        <nav aria-label="Menu super-admin" className="flex flex-1 flex-row gap-1 md:flex-col">
          {MENU.map(({ href, label, ikon: Ikon }) => {
            const aktif = href === '/super-admin' ? pathname === '/super-admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-3 font-display text-[13px] font-semibold transition-colors ${
                  aktif ? 'bg-aura-primary text-white' : 'text-aura-muted hover:bg-white/70 hover:text-aura-primary'
                }`}
              >
                <Ikon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/60 pt-3 md:block">
          <p className="truncate font-display text-[13px] font-semibold text-aura-ink">{nama}</p>
          <p className="font-body text-[11px] text-aura-muted">Super-admin</p>
          <button
            type="button"
            onClick={() => void keluarAkun()}
            className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-xl px-2 text-[12px] font-semibold text-aura-muted hover:bg-aura-red/10 hover:text-aura-red"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Keluar
          </button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 md:p-8">{children}</main>
    </div>
  );
}
