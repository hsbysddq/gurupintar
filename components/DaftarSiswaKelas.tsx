import { BadgeKelompok } from '@/components/BadgeKelompok';
import { KartuKaca } from '@/components/KartuKaca';
import { TombolKeluarkanSiswa } from '@/components/TombolKeluarkanSiswa';
import { TombolSalinKode } from '@/components/TombolSalinKode';
import type { Format, SiswaKelas } from '@/lib/tipe';

const LABEL_FORMAT: Record<Format, string> = {
  video: 'Video',
  audio: 'Audio',
  bacaan: 'Bacaan',
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
