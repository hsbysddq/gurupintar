"use client";

import { useId, useState, type ReactNode } from "react";
import { CircleCheck, Pencil, Sparkles } from "lucide-react";
import { BadgeKelompok, WARNA_KELOMPOK } from "@/components/BadgeKelompok";
import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";
import type { IsiMateri, Kelompok, KodePilihan, MateriGuru } from "@/lib/tipe";

type KartuMateriGuruProps = {
  materi: MateriGuru;
  onSimpan: (isi: IsiMateri, versi: number) => Promise<void>;
};

export const JUDUL_MATERI: Record<Kelompok, string> = {
  belum: "Penguatan Konsep",
  setengah: "Latihan Terarah",
  sudah: "Tantangan",
};

const KODE: KodePilihan[] = ["A", "B", "C", "D"];

const KELAS_ISIAN =
  "w-full rounded-kecil border border-tinta/15 bg-white/80 px-3 py-2 text-base leading-relaxed text-tinta";

type Latihan = IsiMateri["latihan"][number];

// design.md 4.13, PRD AC-6.5 s.d. AC-6.7.
export function KartuMateriGuru({ materi, onSimpan }: KartuMateriGuruProps) {
  const idDasar = useId();
  const [draf, setDraf] = useState<IsiMateri | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);

  const dibagikan = materi.status === "dibagikan";
  const warna = WARNA_KELOMPOK[materi.kelompok];

  function ubahLatihan(indeks: number, ubah: (l: Latihan) => Latihan) {
    setDraf((d) => (d ? { ...d, latihan: d.latihan.map((l, i) => (i === indeks ? ubah(l) : l)) } : d));
  }

  async function simpan() {
    if (!draf) return;
    setMenyimpan(true);
    setGalat(null);
    try {
      await onSimpan(draf, materi.versi);
      setDraf(null);
      setTersimpan(true);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Perubahan belum tersimpan. Coba lagi.");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <KartuKaca as="article" className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-3">
        <div className={`h-1.5 w-12 rounded-full ${warna.utama}`} aria-hidden="true" />
        <h2 className="text-xl leading-snug font-semibold">{JUDUL_MATERI[materi.kelompok]}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <BadgeKelompok kelompok={materi.kelompok} />
          <span className="text-[13px] leading-normal font-medium text-tinta-lembut">{materi.jumlahSiswa} siswa</span>
          {materi.sumber === "ai" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ai px-3 py-1 text-[13px] leading-normal font-medium text-white">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Dibuat AI
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-tinta/10 px-3 py-1 text-[13px] leading-normal font-medium text-tinta">
              Materi cadangan
            </span>
          )}
        </div>
      </header>

      {draf ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void simpan();
          }}
        >
          <Isian label="Ringkasan bacaan" id={`${idDasar}-ringkasan`}>
            <textarea
              id={`${idDasar}-ringkasan`}
              rows={8}
              className={KELAS_ISIAN}
              value={draf.ringkasan}
              onChange={(e) => setDraf({ ...draf, ringkasan: e.target.value })}
            />
          </Isian>
          <Isian label="Naskah audio" id={`${idDasar}-audio`}>
            <textarea
              id={`${idDasar}-audio`}
              rows={6}
              className={KELAS_ISIAN}
              value={draf.naskah_audio}
              onChange={(e) => setDraf({ ...draf, naskah_audio: e.target.value })}
            />
          </Isian>

          {draf.latihan.map((l, i) => {
            const id = `${idDasar}-latihan-${i}`;
            return (
              <fieldset key={i} className="flex flex-col gap-3 rounded-kecil border border-tinta/10 p-4">
                <legend className="px-1 font-semibold">Soal latihan {i + 1}</legend>
                <Isian label="Soal" id={`${id}-soal`}>
                  <textarea
                    id={`${id}-soal`}
                    rows={3}
                    className={KELAS_ISIAN}
                    value={l.soal}
                    onChange={(e) => ubahLatihan(i, (x) => ({ ...x, soal: e.target.value }))}
                  />
                </Isian>
                {KODE.map((kode, p) => (
                  <Isian key={kode} label={`Pilihan ${kode}`} id={`${id}-pilihan-${kode}`}>
                    <input
                      id={`${id}-pilihan-${kode}`}
                      className={`${KELAS_ISIAN} min-h-12`}
                      value={l.pilihan[p]}
                      onChange={(e) =>
                        ubahLatihan(i, (x) => {
                          const pilihan: Latihan["pilihan"] = [...x.pilihan];
                          pilihan[p] = e.target.value;
                          return { ...x, pilihan };
                        })
                      }
                    />
                  </Isian>
                ))}
                <Isian label="Kunci jawaban" id={`${id}-kunci`}>
                  <select
                    id={`${id}-kunci`}
                    className={`${KELAS_ISIAN} min-h-12`}
                    value={l.kunci}
                    onChange={(e) => ubahLatihan(i, (x) => ({ ...x, kunci: e.target.value as KodePilihan }))}
                  >
                    {KODE.map((kode) => (
                      <option key={kode} value={kode}>
                        {kode}
                      </option>
                    ))}
                  </select>
                </Isian>
                <Isian label="Pembahasan" id={`${id}-pembahasan`}>
                  <textarea
                    id={`${id}-pembahasan`}
                    rows={3}
                    className={KELAS_ISIAN}
                    value={l.pembahasan}
                    onChange={(e) => ubahLatihan(i, (x) => ({ ...x, pembahasan: e.target.value }))}
                  />
                </Isian>
              </fieldset>
            );
          })}

          {galat && (
            <p role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
              {galat}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Tombol varian="sekunder" type="submit" memuat={menyimpan}>
              Simpan perubahan
            </Tombol>
            <Tombol
              varian="teks"
              disabled={menyimpan}
              onClick={() => {
                setDraf(null);
                setGalat(null);
              }}
            >
              Batal
            </Tombol>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="font-semibold">{materi.isi.judul}</p>
            <p className="line-clamp-5 whitespace-pre-line text-tinta-lembut">{materi.isi.ringkasan}</p>
            <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
              {materi.isi.latihan.length} soal latihan · Ide video: {materi.isi.ide_video.judul}
            </p>
          </div>
          <div aria-live="polite">
            {tersimpan && !dibagikan && (
              <p className="text-[13px] leading-normal font-medium text-sudah-teks">Perubahan tersimpan.</p>
            )}
          </div>
          {dibagikan ? (
            <p className="inline-flex items-center gap-2 font-semibold text-sudah-teks">
              <CircleCheck aria-hidden="true" className="size-5" />
              Sudah dibagikan
            </p>
          ) : (
            <div>
              <Tombol
                varian="sekunder"
                ikon={Pencil}
                onClick={() => {
                  setDraf(materi.isi);
                  setTersimpan(false);
                  setGalat(null);
                }}
              >
                Ubah
              </Tombol>
            </div>
          )}
        </>
      )}
    </KartuKaca>
  );
}

function Isian({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] leading-normal font-medium text-tinta-lembut">
        {label}
      </label>
      {children}
    </div>
  );
}
