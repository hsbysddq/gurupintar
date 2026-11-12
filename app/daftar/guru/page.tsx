import Link from 'next/link';
import { BingkaiAuth } from '@/components/BingkaiAuth';

export default function HalamanDaftarGuru() {
  return (
    <BingkaiAuth
      judul="Pendaftaran ditutup"
      keterangan="Akun guru dibuat oleh admin sekolah. Hubungi admin sekolahmu untuk mendapatkan akun."
      footer={
        <Link href="/masuk" className="font-semibold text-primer hover:underline">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <p className="text-[14px] leading-[22px] text-tinta-lembut">
        Jika kamu sudah punya akun, masuk dengan email dan kata sandi dari admin sekolah.
      </p>
    </BingkaiAuth>
  );
}
