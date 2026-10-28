import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { FormGabungMapel } from '@/components/FormGabungMapel';
import { KartuKaca } from '@/components/KartuKaca';
import { TombolHapusKelas } from '@/components/TombolHapusKelas';
import { ikonMapel, warnaMapel } from '@/components/ikon-mapel';
import { labelKelas, type ProgresKelas } from '@/lib/beranda-siswa';

/**
 * Halaman Mata Pelajaran siswa, mengikuti sketsa: bar gabung kode mapel di atas,
 * lalu kartu tiap mapel dengan tombol untuk membukanya.
 */
export function DaftarMapelSiswa({ kelas }: { kelas: ProgresKelas[] }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-aura-ink md:text-[32px]">
          Mata Pelajaran
        </h1>
        <p className="text-aura-muted">
          {kelas.length > 0
            ? `${kelas.length} mata pelajaran yang kamu ikuti. Buka salah satu untuk melihat kuis dan materinya.`
            : 'Belum ada mata pelajaran. Gabung dulu dengan kode dari gurumu.'}
        </p>
      </header>

      <KartuKaca as="section" className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[16px] leading-snug font-bold text-aura-ink">Gabung kode mapel</h2>
          <p className="text-[13px] leading-normal text-aura-muted">
            Masukkan kode undangan kelas dari gurumu. Kode ini berbeda dari kode kuis.
          </p>
        </div>
        <FormGabungMapel tata="baris" />
      </KartuKaca>

      {kelas.length === 0 ? (
        <KartuKaca as="section" className="flex flex-col gap-1 p-6">
          <h2 className="font-display text-[18px] leading-snug font-bold text-aura-ink">
            Belum tergabung di mata pelajaran mana pun
          </h2>
          <p className="text-aura-muted">Minta kode undangan kelas kepada gurumu, lalu masukkan di kolom di atas.</p>
        </KartuKaca>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kelas.map((k) => {
            const Ikon = ikonMapel(k.mapel);
            const warna = warnaMapel(k.id);
            return (
              <li key={k.id}>
                <KartuKaca as="article" className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${warna.ikon}`}>
                      <Ikon aria-hidden="true" className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 font-display text-[20px] leading-snug font-bold break-words text-aura-ink">
                        {k.mapel}
                      </h2>
                      <p className="truncate text-[13px] leading-normal text-aura-muted">
                        {labelKelas(k.nama)}
                        {k.namaGuru ? ` · ${k.namaGuru}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[12px] leading-normal font-semibold ${warna.teks}`}>
                        Progres {k.progres}% · {k.dikerjakan}/{k.jumlahKuis} kuis
                      </p>
                      {k.kodeKuisAktif && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primer-lembut px-2.5 py-0.5 text-[12px] leading-normal font-semibold text-primer">
                          <PlayCircle aria-hidden="true" className="size-3.5" />
                          Kuis aktif
                        </span>
                      )}
                    </div>
                    <div
                      role="img"
                      aria-label={`Progres ${k.mapel}: ${k.progres} persen`}
                      className="h-2 overflow-hidden rounded-full bg-tinta/10"
                    >
                      <div className={`h-full rounded-full ${warna.bilah}`} style={{ width: `${k.progres}%` }} />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    {k.kodeKuisAktif && (
                      <Link
                        href={`/siswa/gabung?kode=${encodeURIComponent(k.kodeKuisAktif)}`}
                        className="text-[14px] leading-normal font-semibold text-aura-primary hover:underline"
                      >
                        Kerjakan kuis sekarang →
                      </Link>
                    )}
                    <Link
                      href={`/siswa/kelas/detail?kelas=${k.id}`}
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-aura-primary px-4 text-[15px] font-semibold text-white hover:bg-aura-primary-deep"
                    >
                      Buka Mapel
                    </Link>
                    <TombolHapusKelas kelasId={k.id} mapel={k.mapel} />
                  </div>
                </KartuKaca>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
