import Link from 'next/link';
import { ClipboardCheck, GraduationCap, School, Users } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib, wajibSekolah } from '@/lib/server/auth';
import { daftarGuruSekolah, daftarSiswaSekolah } from '@/lib/server/akun';
import { daftarKelasSekolah } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';

export default async function HalamanAdmin() {
  const profil = await profilWajib('admin_sekolah');
  const sekolahId = wajibSekolah(profil);
  const db = ambilSupabase();
  const [guru, siswa, kelas] = await Promise.all([
    daftarGuruSekolah(db, sekolahId),
    daftarSiswaSekolah(db, sekolahId),
    daftarKelasSekolah(db, sekolahId),
  ]);

  const kartu = [
    { label: 'Guru', nilai: guru.length, href: '/admin/guru', ikon: GraduationCap },
    { label: 'Siswa', nilai: siswa.length, href: '/admin/siswa', ikon: Users },
    { label: 'Kelas', nilai: kelas.length, href: '/admin/ujian', ikon: School },
    { label: 'Ujian', nilai: '—', href: '/admin/ujian', ikon: ClipboardCheck },
  ];

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">Admin sekolah</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
          Selamat datang, {profil.nama}
        </h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">
          Kelola akun guru, siswa, dan ujian sekolah.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map(({ label, nilai, href, ikon: Ikon }) => (
          <Link key={label} href={href}>
            <KartuKaca className="flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                <Ikon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="font-display text-[24px] leading-none font-extrabold text-aura-ink">{nilai}</p>
                <p className="mt-1 font-body text-[12px] text-aura-muted">{label}</p>
              </div>
            </KartuKaca>
          </Link>
        ))}
      </div>
      <KartuKaca className="p-5">
        <h2 className="font-display text-[18px] font-bold text-aura-ink">Langkah berikutnya</h2>
        <p className="mt-2 font-body text-[14px] leading-[22px] text-aura-muted">
          Buat akun guru terlebih dahulu, lalu siswa. Setelah guru membuat ujian, admin dapat memantau dan membuka peserta yang diblokir dari halaman Ujian.
        </p>
      </KartuKaca>
    </div>
  );
}
