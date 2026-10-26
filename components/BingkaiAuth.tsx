import type { ReactNode } from 'react';
import Link from 'next/link';
import { TulisanGuruPintar } from '@/components/LogoGuruPintar';
import { KartuKaca } from '@/components/KartuKaca';

type BingkaiAuthProps = {
  judul: string;
  keterangan: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function BingkaiAuth({ judul, keterangan, children, footer }: BingkaiAuthProps) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" aria-label="Guru Pintarku, ke beranda" className="mb-6 flex min-h-12 items-center gap-2 self-center rounded-full font-bold">
        <TulisanGuruPintar className="h-5 w-auto shrink-0" />
      </Link>

      <KartuKaca as="section" className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-tight font-bold">{judul}</h1>
          <p className="text-tinta-lembut">{keterangan}</p>
        </header>
        {children}
      </KartuKaca>

      {footer && <div className="mt-6 text-center text-tinta-lembut">{footer}</div>}
    </div>
  );
}

export function KolomAuth({
  id,
  label,
  children,
  petunjuk,
}: {
  id: string;
  label: string;
  children: ReactNode;
  petunjuk?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] leading-normal font-medium text-tinta-lembut">
        {label}
      </label>
      {children}
      {petunjuk && (
        <p id={`${id}-petunjuk`} className="text-[13px] leading-normal text-tinta-lembut">
          {petunjuk}
        </p>
      )}
    </div>
  );
}

export const KELAS_INPUT_AUTH =
  'h-12 w-full rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta placeholder:text-tinta-lembut/60';
