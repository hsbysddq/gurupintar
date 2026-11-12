import Link from 'next/link';
import { ClipboardCheck, Plus } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib, wajibSekolah } from '@/lib/server/auth';
import { daftarUjianGuru } from '@/lib/server/ujian';
import { formatJadwal } from '@/lib/jadwal-kuis';

export default async function HalamanUjianGuru() {
  const profil = await profilWajib('guru');
  const daftar = await daftarUjianGuru(profil.id, wajibSekolah(profil));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="aura-eyebrow">Ujian formal</span>
          <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
            Ujian
          </h1>
          <p className="font-body text-[14px] leading-[22px] text-aura-muted">
            Buat ujian berbobot dengan token dan pantau peserta yang sedang mengerjakan.
          </p>
        </div>
        <Link href="/guru/ujian/baru" className="aura-btn aura-btn-primary h-12 px-5 text-[13px]">
          <Plus aria-hidden="true" className="size-4" />
          Buat ujian
        </Link>
      </header>

      {daftar.length === 0 ? (
        <KartuKaca className="flex flex-col items-center gap-3 p-10 text-center">
          <ClipboardCheck aria-hidden="true" className="size-10 text-aura-primary" />
          <h2 className="font-display text-[20px] font-bold text-aura-ink">Belum ada ujian</h2>
          <p className="max-w-md font-body text-[14px] leading-[22px] text-aura-muted">
            Buat ujian dari bank soal yang sudah ada, atur bobot dan waktu, lalu bagikan token ke siswa.
          </p>
          <Link href="/guru/ujian/baru" className="aura-btn aura-btn-primary h-11 px-5 text-[13px]">
            Buat ujian pertama
          </Link>
        </KartuKaca>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {daftar.map((u) => (
            <li key={u.id}>
              <Link href={`/guru/ujian/${u.id}`}>
                <KartuKaca className="flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-[17px] font-bold text-aura-ink">{u.judul}</h2>
                      <p className="font-body text-[12px] text-aura-muted">{u.namaKelas}</p>
                    </div>
                    <span className="rounded-full bg-aura-primary/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-primary">
                      {u.status}
                    </span>
                  </div>
                  <p className="font-body text-[12px] text-aura-muted">
                    {formatJadwal(u.mulaiPada)} — {formatJadwal(u.selesaiPada)} · {u.durasiMenit} menit
                  </p>
                  <p className="font-body text-[12px] font-semibold text-aura-ink">
                    {u.jumlahPeserta} peserta · {u.jumlahMengerjakan} mengerjakan · {u.jumlahSelesai} selesai
                    {u.jumlahDiblokir > 0 ? ` · ${u.jumlahDiblokir} diblokir` : ''}
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
