'use client';

import { useState } from 'react';
import { Check, FileText, Loader2, X } from 'lucide-react';
import { GambarSoal } from '@/components/GambarSoal';
import { KartuKaca } from '@/components/KartuKaca';
import { ErrorApi, nilaiJawabanEsai } from '@/lib/api-klien';
import type { JawabanEsaiGuru } from '@/lib/tipe';

export function KartuPenilaianEsai({
  sesiId,
  daftar,
  onDinilai,
}: {
  sesiId: string;
  daftar: JawabanEsaiGuru[];
  onDinilai: () => void;
}) {
  const [sibukKunci, setSibukKunci] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  if (daftar.length === 0) return null;

  const belumDinilai = daftar.filter((d) => d.belumDinilai).length;

  async function nilai(item: JawabanEsaiGuru, benar: boolean) {
    const kunciAksi = `${item.siswaId}:${item.soalId}`;
    setSibukKunci(kunciAksi);
    setGalat(null);
    try {
      await nilaiJawabanEsai({
        sesiId,
        siswaId: item.siswaId,
        soalId: item.soalId,
        benar,
      });
      onDinilai();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Penilaian esai belum tersimpan. Coba lagi sebentar.');
    } finally {
      setSibukKunci(null);
    }
  }

  return (
    <KartuKaca varian="pekat" as="section" className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="inline-flex items-center gap-2 text-xl leading-snug font-semibold">
            <FileText aria-hidden="true" className="size-5 text-primer" />
            Penilaian soal esai
          </h2>
          <p className="text-[14px] leading-normal text-tinta-lembut">
            Tandai Benar atau Salah untuk setiap jawaban uraian siswa. Skor dan pengelompokan pemahaman siswa langsung diperbarui.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-display text-[12px] font-bold ${
            belumDinilai > 0
              ? 'bg-setengah-latar text-setengah-teks'
              : 'bg-sudah-latar text-sudah-teks'
          }`}
        >
          {belumDinilai > 0 ? `${belumDinilai} menunggu dinilai` : 'Semua sudah dinilai'}
        </span>
      </div>

      {galat && (
        <p role="alert" className="rounded-xl bg-belum-latar px-3 py-2 text-[13px] font-medium text-belum-teks">
          {galat}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {daftar.map((item) => {
          const kunciAksi = `${item.siswaId}:${item.soalId}`;
          const sedangMenyimpan = sibukKunci === kunciAksi;
          return (
            <li
              key={kunciAksi}
              className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primer/10 px-2.5 py-0.5 font-display text-[11px] font-bold text-primer">
                    Soal {item.nomorSoal}
                  </span>
                  <span className="font-semibold text-tinta">{item.namaSiswa}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    item.belumDinilai
                      ? 'bg-setengah-latar text-setengah-teks'
                      : item.benar
                        ? 'bg-sudah-latar text-sudah-teks'
                        : 'bg-belum-latar text-belum-teks'
                  }`}
                >
                  {item.belumDinilai ? 'Menunggu dinilai' : item.benar ? 'Dinilai Benar' : 'Dinilai Salah'}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[13px] leading-snug font-medium text-tinta-lembut">{item.teksSoal}</p>
                {item.gambarSoal && (
                  <GambarSoal src={item.gambarSoal} alt={`Gambar soal ${item.nomorSoal}`} ringkas />
                )}
              </div>

              <div className="rounded-xl border border-tinta/10 bg-white p-3">
                <p className="font-display text-[10px] font-bold uppercase tracking-wider text-tinta-lembut">
                  Jawaban siswa
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-tinta">
                  {item.jawabanTeks}
                </p>
              </div>

              {item.pedomanJawaban && (
                <div className="rounded-xl bg-primer/5 px-3 py-2 text-[12px] leading-normal text-tinta-lembut">
                  <strong className="font-semibold text-tinta">Pedoman jawaban:</strong> {item.pedomanJawaban}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={sibukKunci !== null}
                  onClick={() => void nilai(item, true)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 font-display text-[12px] font-bold transition-colors disabled:opacity-60 ${
                    !item.belumDinilai && item.benar
                      ? 'bg-sudah text-white shadow-sm'
                      : 'border border-sudah/35 bg-sudah-latar text-sudah-teks hover:bg-sudah/20'
                  }`}
                >
                  {sedangMenyimpan ? (
                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                  ) : (
                    <Check aria-hidden="true" className="size-3.5" />
                  )}
                  Benar
                </button>
                <button
                  type="button"
                  disabled={sibukKunci !== null}
                  onClick={() => void nilai(item, false)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 font-display text-[12px] font-bold transition-colors disabled:opacity-60 ${
                    !item.belumDinilai && !item.benar
                      ? 'bg-belum text-white shadow-sm'
                      : 'border border-belum/35 bg-belum-latar text-belum-teks hover:bg-belum/20'
                  }`}
                >
                  {sedangMenyimpan ? (
                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                  ) : (
                    <X aria-hidden="true" className="size-3.5" />
                  )}
                  Salah
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </KartuKaca>
  );
}

