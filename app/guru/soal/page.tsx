"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";
import { simpanTopik } from "@/lib/api-klien";
import { JUMLAH_SOAL_TOPIK } from "@/lib/konstanta";
import { skemaBodyTopikBaru } from "@/lib/skema-api";
import { KODE_PILIHAN, pesanGalatTopik } from "@/lib/soal-guru";
import type { KodePilihan } from "@/lib/tipe";

type Empat = [string, string, string, string];
type IsianSoal = { teks: string; pilihan: Empat; kunci: KodePilihan | ""; miskonsepsi: Empat };
type Isian = { nama: string; capaianPembelajaran: string; soal: IsianSoal[] };
type Pengiriman = { status: "diam" } | { status: "mengirim" } | { status: "berhasil"; nama: string } | { status: "gagal"; pesan: string };

const KELAS_ISIAN = "w-full rounded-kecil border border-tinta/15 bg-white/80 px-3 py-2 text-base leading-relaxed text-tinta";

const isianKosong = (): Isian => ({
  nama: "",
  capaianPembelajaran: "",
  soal: Array.from({ length: JUMLAH_SOAL_TOPIK }, () => ({
    teks: "",
    pilihan: ["", "", "", ""],
    kunci: "",
    miskonsepsi: ["", "", "", ""],
  })),
});

// PRD F-10, design.md 3.9. Soal yang sudah disimpan tidak bisa diubah atau dihapus.
export default function HalamanBuatSoal() {
  const idDasar = useId();
  const [isian, setIsian] = useState<Isian>(isianKosong);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [pengiriman, setPengiriman] = useState<Pengiriman>({ status: "diam" });

  /** id elemen untuk jalur kolom, misalnya "soal.1.pilihan.2". */
  const idKolom = (jalur: string) => `${idDasar}-${jalur.replaceAll(".", "-")}`;

  function ubahSoal(i: number, ubah: (s: IsianSoal) => IsianSoal) {
    setIsian((lama) => ({ ...lama, soal: lama.soal.map((s, j) => (j === i ? ubah(s) : s)) }));
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (pengiriman.status === "mengirim") return;

    const hasil = skemaBodyTopikBaru.safeParse(isian);
    if (!hasil.success) {
      const pesan = pesanGalatTopik(hasil);
      setGalat(pesan);
      setPengiriman({ status: "diam" });
      // Fokus ke kolom salah yang pertama agar mudah ditemukan.
      document.getElementById(idKolom(Object.keys(pesan)[0]))?.focus();
      return;
    }

    setGalat({});
    setPengiriman({ status: "mengirim" });
    try {
      const topik = await simpanTopik(hasil.data);
      setIsian(isianKosong());
      setPengiriman({ status: "berhasil", nama: topik.nama });
    } catch (err) {
      setPengiriman({ status: "gagal", pesan: err instanceof Error ? err.message : "Topik belum berhasil disimpan." });
    }
  }

  return (
    <form noValidate onSubmit={(e) => void simpan(e)} className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">Buat soal</h1>
        <p className="text-base leading-snug font-semibold">
          Khusus soal matematika SMP kelas 7. Buat satu topik dengan tepat {JUMLAH_SOAL_TOPIK} soal pilihan ganda.
        </p>
      </header>

      <KartuKaca className="flex flex-col gap-4 p-6">
        <Kolom id={idKolom("nama")} label="Nama topik" galat={galat.nama}>
          <input
            id={idKolom("nama")}
            className={KELAS_ISIAN}
            value={isian.nama}
            aria-invalid={Boolean(galat.nama)}
            aria-describedby={galat.nama ? `${idKolom("nama")}-galat` : undefined}
            onChange={(e) => setIsian((l) => ({ ...l, nama: e.target.value }))}
          />
        </Kolom>
        <Kolom id={idKolom("capaianPembelajaran")} label="Capaian pembelajaran" galat={galat.capaianPembelajaran}>
          <textarea
            id={idKolom("capaianPembelajaran")}
            rows={2}
            className={KELAS_ISIAN}
            value={isian.capaianPembelajaran}
            aria-invalid={Boolean(galat.capaianPembelajaran)}
            aria-describedby={galat.capaianPembelajaran ? `${idKolom("capaianPembelajaran")}-galat` : undefined}
            onChange={(e) => setIsian((l) => ({ ...l, capaianPembelajaran: e.target.value }))}
          />
        </Kolom>
      </KartuKaca>

      {isian.soal.map((s, i) => {
        const jalur = (kolom: string) => `soal.${i}.${kolom}`;
        const propsGalat = (kolom: string) => ({
          "aria-invalid": Boolean(galat[jalur(kolom)]),
          "aria-describedby": galat[jalur(kolom)] ? `${idKolom(jalur(kolom))}-galat` : undefined,
        });
        return (
          <KartuKaca key={i} as="section" className="p-6">
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-4 text-xl leading-snug font-semibold">Soal {i + 1}</legend>

              <Kolom id={idKolom(jalur("teks"))} label="Teks soal" galat={galat[jalur("teks")]}>
                <textarea
                  id={idKolom(jalur("teks"))}
                  rows={3}
                  className={KELAS_ISIAN}
                  value={s.teks}
                  {...propsGalat("teks")}
                  onChange={(e) => ubahSoal(i, (x) => ({ ...x, teks: e.target.value }))}
                />
              </Kolom>

              <div className="grid gap-3 md:grid-cols-2">
                {KODE_PILIHAN.map((kode, j) => (
                  <Kolom key={kode} id={idKolom(jalur(`pilihan.${j}`))} label={`Pilihan ${kode}`} galat={galat[jalur(`pilihan.${j}`)]}>
                    <input
                      id={idKolom(jalur(`pilihan.${j}`))}
                      className={KELAS_ISIAN}
                      value={s.pilihan[j]}
                      {...propsGalat(`pilihan.${j}`)}
                      onChange={(e) =>
                        ubahSoal(i, (x) => ({ ...x, pilihan: x.pilihan.map((p, k) => (k === j ? e.target.value : p)) as Empat }))
                      }
                    />
                  </Kolom>
                ))}
              </div>

              <fieldset
                id={idKolom(jalur("kunci"))}
                tabIndex={-1}
                {...propsGalat("kunci")}
                className="flex flex-col gap-2"
              >
                <legend className="text-[13px] leading-normal font-medium text-tinta-lembut">Kunci jawaban</legend>
                <div className="flex flex-wrap gap-2">
                  {KODE_PILIHAN.map((kode) => (
                    <label
                      key={kode}
                      className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 rounded-kecil border px-4 font-semibold transition-colors ${
                        s.kunci === kode ? "border-primer bg-primer text-white" : "border-tinta/15 bg-white/80 text-tinta hover:bg-primer-lembut"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${idDasar}-kunci-${i}`}
                        value={kode}
                        checked={s.kunci === kode}
                        onChange={() => ubahSoal(i, (x) => ({ ...x, kunci: kode }))}
                        className="sr-only"
                      />
                      {kode}
                    </label>
                  ))}
                </div>
                {galat[jalur("kunci")] && (
                  <p id={`${idKolom(jalur("kunci"))}-galat`} className="text-[13px] leading-normal font-medium text-belum-teks">
                    {galat[jalur("kunci")]}
                  </p>
                )}
              </fieldset>

              <div className="flex flex-col gap-3">
                <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
                  Kesalahan pemahaman jika siswa memilih jawaban salah (opsional). Dipakai untuk menyusun materi lanjutan.
                </p>
                {KODE_PILIHAN.map((kode, j) =>
                  kode === s.kunci ? null : (
                    <Kolom
                      key={kode}
                      id={idKolom(jalur(`miskonsepsi.${j}`))}
                      label={`Jika memilih ${kode}`}
                      galat={galat[jalur(`miskonsepsi.${j}`)]}
                    >
                      <input
                        id={idKolom(jalur(`miskonsepsi.${j}`))}
                        className={KELAS_ISIAN}
                        value={s.miskonsepsi[j]}
                        {...propsGalat(`miskonsepsi.${j}`)}
                        onChange={(e) =>
                          ubahSoal(i, (x) => ({
                            ...x,
                            miskonsepsi: x.miskonsepsi.map((m, k) => (k === j ? e.target.value : m)) as Empat,
                          }))
                        }
                      />
                    </Kolom>
                  ),
                )}
              </div>
            </fieldset>
          </KartuKaca>
        );
      })}

      <div aria-live="polite" className="flex flex-col gap-1">
        {Object.keys(galat).length > 0 && (
          <p role="alert" className="font-medium text-belum-teks">
            Ada isian yang belum sesuai. Periksa kolom yang ditandai.
          </p>
        )}
        {pengiriman.status === "gagal" && (
          <p role="alert" className="font-medium text-belum-teks">
            {pengiriman.pesan}
          </p>
        )}
        {pengiriman.status === "berhasil" && (
          <p className="font-semibold text-sudah-teks">
            Topik &quot;{pengiriman.nama}&quot; tersimpan. Pilih topik ini saat membuka kuis baru di{" "}
            <Link href="/guru" className="underline">
              Dashboard
            </Link>
            .
          </p>
        )}
      </div>

      <div>
        <Tombol varian="utama" type="submit" ikon={Save} memuat={pengiriman.status === "mengirim"}>
          Simpan topik dan soal
        </Tombol>
      </div>
    </form>
  );
}

type KolomProps = { id: string; label: string; galat?: string; children: ReactNode };

function Kolom({ id, label, galat, children }: KolomProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] leading-normal font-medium text-tinta-lembut">
        {label}
      </label>
      {children}
      {galat && (
        <p id={`${id}-galat`} className="text-[13px] leading-normal font-medium text-belum-teks">
          {galat}
        </p>
      )}
    </div>
  );
}
