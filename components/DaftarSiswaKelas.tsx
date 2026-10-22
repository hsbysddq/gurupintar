import { BadgeKelompok } from '@/components/BadgeKelompok';
import { KartuKaca } from '@/components/KartuKaca';
import { TombolSalinKode } from '@/components/TombolSalinKode';
import type { Format, SiswaKelas } from '@/lib/tipe';

const LABEL_FORMAT: Record<Format, string> = {
  video: 'Video',
  audio: 'Audio',
  bacaan: 'Bacaan',
  latihan: 'Latihan',
};

export function DaftarSiswaKelas({ siswa, kodeUndangan }: { siswa: SiswaKelas[]; kodeUndangan: string }) {
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
            <li key={s.siswaId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-3">
              <span className="font-semibold">{s.nama}</span>
              <span className="flex flex-wrap items-center gap-2">
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
              </span>
            </li>
          ))}
        </ul>
      </KartuKaca>

      <p className="text-[13px] leading-normal text-tinta-lembut">
        Label kelompok dan skor hanya terlihat oleh guru.
      </p>
    </section>
  );
}
