import Link from 'next/link';
import { LogoGuruPintar } from '@/components/LogoGuruPintar';
import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-10">
      <KartuKaca as="section" className="flex flex-col items-center gap-4 p-8 text-center">
        <LogoGuruPintar className="h-16 w-auto" />
        <h1 className="text-[28px] leading-tight font-bold">Halaman tidak ditemukan</h1>
        <p className="text-tinta-lembut">Alamat ini tidak tersedia. Periksa kembali tautannya.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Tombol varian="utama" href="/">
            Ke beranda
          </Tombol>
          <Tombol varian="sekunder" href="/masuk">
            Masuk
          </Tombol>
        </div>
        <Link href="/siswa" className="text-[13px] leading-normal font-semibold text-primer hover:underline">
          Ke halaman siswa
        </Link>
      </KartuKaca>
    </div>
  );
}
