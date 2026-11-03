import { ShieldAlert } from 'lucide-react';
import { BadgeKelompok } from '@/components/BadgeKelompok';
import { KartuKaca } from '@/components/KartuKaca';
import { TombolBukaBlokir } from '@/components/TombolBukaBlokir';
import { TombolKeluarkanSiswa } from '@/components/TombolKeluarkanSiswa';
import { TombolSalinKode } from '@/components/TombolSalinKode';
import type { Format, SiswaKelas } from '@/lib/tipe';

const LABEL_FORMAT: Record<Format, string> = {
  video: 'Video',
  audio: 'Audio',
  bacaan: 'Bacaan',
  ppt: 'PPT',
  latihan: 'Latihan',
};

export function DaftarSiswaKelas({
  siswa,
  kodeUndangan,
  kelasId,
}: {
  siswa: SiswaKelas[];
  kodeUndangan: string;
  kelasId: string;
}) {
  if (siswa.length === 0) {
    return (
      <KartuKaca as="section" className="flex flex-col gap-2 p-6">
        <h2 className="text-xl leading-snug font-semibold">Belum ada siswa</h2>
        <p className="text-tinta-lembut">
          Bagikan kode undangan <strong className="tracking-wide text-tinta">{kodeUndangan}</strong> agar siswa bisa
          mendaftar dan bergabung ke kelas ini.
        </p>
        <div>
          <TombolSalinKode kode={kodeUndangan} />
        </div>
      </KartuKaca>
    );
  }

  const jumlahDiblokir = siswa.filter((s) => s.blokir.length > 0).length;

  return (
    <section className="flex flex-col gap-4">
      <KartuKaca as="div" className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl leading-snug font-semibold">Daftar siswa</h2>
          <p className="text-tinta-lembut">
            {siswa.length} siswa · Kode undangan <strong className="tracking-wide text-tinta">{kodeUndangan}</strong>
          </p>
        </div>
        <TombolSalinKode kode={kodeUndangan} />
      </KartuKaca>

      {jumlahDiblokir > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-kecil bg-belum-latar px-4 py-3 text-[14px] leading-normal text-belum-teks"
        >
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>{jumlahDiblokir} siswa diblokir karena curang.</strong> Mereka meninggalkan halaman kuis 3 kali dan
            tidak bisa mengerjakan lagi sampai kamu membuka blokirnya.
          </p>
        </div>
      )}

      <KartuKaca as="div" className="p-2">
        <ul className="flex flex-col divide-y divide-tinta/10">
          {siswa.map((s) => (
            <li key={s.siswaId} className="flex flex-wrap items-start justify-between gap-3 px-3 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold">{s.nama}</span>
                <span className="truncate text-[12px] leading-normal text-tinta-lembut">
                  {s.email ?? 'Email tidak tersedia'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="rounded-full bg-tinta/5 px-2.5 py-1 text-[12px] leading-normal font-medium text-tinta-lembut">
                  {s.format ? LABEL_FORMAT[s.format] : 'Format belum dipilih'}
                </span>
                {s.kelompok ? (
                  <BadgeKelompok kelompok={s.kelompok} />
                ) : (
                  <span className="text-[12px] leading-normal text-tinta-lembut">Belum ada hasil</span>
                )}
                {s.skor !== null && (
                  <span className="text-[13px] leading-normal font-semibold text-tinta-lembut">
                    {s.skor}/{s.total}
                  </span>
                )}
                <TombolKeluarkanSiswa kelasId={kelasId} siswaId={s.siswaId} nama={s.nama} />
              </div>
              {s.blokir.length > 0 && (
                <ul className="flex w-full flex-col gap-2">
                  {s.blokir.map((b) => (
                    <li
                      key={b.sesiId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-kecil bg-belum-latar px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-[13px] leading-normal text-belum-teks">
                        <ShieldAlert aria-hidden="true" className="size-4 shrink-0" />
                        <span className="min-w-0">
                          <strong>Diblokir karena curang</strong> di kuis {b.namaKuis}
                          {b.jumlahBlokir > 1 && ` · sudah ${b.jumlahBlokir} kali`}
                        </span>
                      </span>
                      <TombolBukaBlokir sesiId={b.sesiId} siswaId={s.siswaId} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </KartuKaca>

      <p className="text-[13px] leading-normal text-tinta-lembut">
        Email, label kelompok, dan skor hanya terlihat oleh guru. Mengeluarkan siswa juga menghapus jawaban dan hasilnya
        di kelas ini.
      </p>
    </section>
  );
}
