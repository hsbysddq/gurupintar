import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib, wajibSekolah } from '@/lib/server/auth';
import { daftarUjianAdmin } from '@/lib/server/ujian';
import { formatJadwal } from '@/lib/jadwal-kuis';

export default async function HalamanUjianAdmin() {
  const profil = await profilWajib('admin_sekolah');
  const daftar = await daftarUjianAdmin(wajibSekolah(profil));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">Ujian</h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">
          Pantau ujian sekolah dan buka peserta yang diblokir.
        </p>
      </header>
      {daftar.length === 0 ? (
        <KartuKaca className="flex flex-col items-center gap-3 p-10 text-center">
          <ClipboardCheck className="size-10 text-aura-primary" />
          <p className="text-[14px] text-aura-muted">Belum ada ujian di sekolah ini.</p>
        </KartuKaca>
      ) : (
        <ul className="flex flex-col gap-3">
          {daftar.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/ujian/${u.id}`}>
                <KartuKaca className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-display text-[15px] font-bold text-aura-ink">{u.judul}</p>
                    <p className="font-body text-[12px] text-aura-muted">
                      {u.namaKelas} · {formatJadwal(u.mulaiPada)} — {formatJadwal(u.selesaiPada)}
                    </p>
                  </div>
                  <p className="font-body text-[12px] font-semibold text-aura-ink">
                    {u.jumlahPeserta} peserta · {u.jumlahDiblokir} diblokir
                  </p>
                </KartuKaca>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
