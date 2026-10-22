"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";
import { ambilDaftarKelas, bukaSesi, simpanTopik } from "@/lib/api-klien";
import { JUMLAH_SOAL_TOPIK } from "@/lib/konstanta";
import { skemaBodyTopikBaru } from "@/lib/skema-api";
import { KODE_PILIHAN, pesanGalatTopik } from "@/lib/soal-guru";
import type { KelasRingkas, KodePilihan } from "@/lib/tipe";

type Empat = [string, string, string, string];
type IsianSoal = { teks: string; pilihan: Empat; kunci: KodePilihan | ""; miskonsepsi: Empat };
type Isian = { kelasId: string; soal: IsianSoal[] };
type Pengiriman =
  | { status: "diam" }
  | { status: "mengirim" }
  | { status: "berhasil"; kelasId: string; namaKelas: string; kode: string | null }
  | { status: "gagal"; pesan: string };

const namaKelasLengkap = (k: KelasRingkas) => `${k.nama} · ${k.mapel}`;

const KELAS_ISIAN = "w-full rounded-kecil border border-tinta/15 bg-white/80 px-3 py-2 text-base leading-relaxed text-tinta";

const isianKosong = (): Isian => ({
  kelasId: "",
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
  const [daftarKelas, setDaftarKelas] = useState<KelasRingkas[] | null>(null);
  const [galatKelas, setGalatKelas] = useState<string | null>(null);

  // Pilihan kelas diambil dari kelas yang sudah dibuat guru. Jika hanya ada satu, langsung terpilih.
  useEffect(() => {
    let batal = false;
    ambilDaftarKelas()
      .then((daftar) => {
        if (batal) return;
        setDaftarKelas(daftar);
        if (daftar.length === 1) setIsian((lama) => ({ ...lama, kelasId: daftar[0].id }));
      })
      .catch((err: unknown) => {
        if (!batal) setGalatKelas(err instanceof Error ? err.message : "Daftar kelas belum bisa dimuat.");
      });
    return () => {
      batal = true;
    };
  }, []);

  const kelasDipilih = daftarKelas?.find((k) => k.id === isian.kelasId) ?? null;

  /** id elemen untuk jalur kolom, misalnya "soal.1.pilihan.2". */
  const idKolom = (jalur: string) => `${idDasar}-${jalur.replaceAll(".", "-")}`;

  function ubahSoal(i: number, ubah: (s: IsianSoal) => IsianSoal) {
    setIsian((lama) => ({ ...lama, soal: lama.soal.map((s, j) => (j === i ? ubah(s) : s)) }));
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (pengiriman.status === "mengirim") return;

    const kelas = kelasDipilih;
    // Nama topik dan capaian dibuat otomatis dari kelas yang dipilih, guru tidak perlu mengisinya.
    const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const hasil = skemaBodyTopikBaru.safeParse({
      nama: kelas ? `${namaKelasLengkap(kelas)} · ${tanggal}`.slice(0, 80) : "",
      capaianPembelajaran: kelas ? `Soal buatan guru untuk mata pelajaran ${kelas.mapel}, ${kelas.nama}.`.slice(0, 300) : "",
      soal: isian.soal,
    });

    const pesan: Record<string, string> = hasil.success ? {} : pesanGalatTopik(hasil);
    delete pesan.nama;
    delete pesan.capaianPembelajaran;
    if (!kelas) Object.assign(pesan, { kelasId: "Pilih kelas dulu." });
    if (!hasil.success || !kelas) {
      const urut = kelas ? pesan : { kelasId: pesan.kelasId, ...pesan };
      setGalat(urut);
      setPengiriman({ status: "diam" });
      // Fokus ke kolom salah yang pertama agar mudah ditemukan.
      document.getElementById(idKolom(Object.keys(urut)[0]))?.focus();
      return;
    }

    setGalat({});
    setPengiriman({ status: "mengirim" });
    try {
      const topik = await simpanTopik(hasil.data);
      let kode: string | null = null;
      try {
        // Soal langsung dipakai sebagai kuis kelas ini, sehingga muncul di Riwayat kuis.
        kode = (await bukaSesi({ kelasId: kelas.id, topikId: topik.id })).kodeKelas;
      } catch {
        // Soal sudah tersimpan; kuis bisa dibuka manual dari Kelola kelas.
      }
      setIsian({ ...isianKosong(), kelasId: kelas.id });
      setPengiriman({ status: "berhasil", kelasId: kelas.id, namaKelas: namaKelasLengkap(kelas), kode });
    } catch (err) {
      setPengiriman({ status: "gagal", pesan: err instanceof Error ? err.message : "Soal belum berhasil disimpan." });
    }
  }

  return (
    <form noValidate onSubmit={(e) => void simpan(e)} className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">Buat soal</h1>
        <p className="text-base leading-snug font-semibold">
          Pilih kelas, lalu tulis tepat {JUMLAH_SOAL_TOPIK} soal pilihan ganda. Setelah disimpan, soal langsung menjadi kuis untuk kelas itu.
        </p>
      </header>

      <KartuKaca className="flex flex-col gap-4 p-6">
        <Kolom id={idKolom("kelasId")} label="Kelas dan mata pelajaran" galat={galat.kelasId ?? galatKelas ?? undefined}>
          <select
            id={idKolom("kelasId")}
            className={`${KELAS_ISIAN} h-12`}
            value={isian.kelasId}
            disabled={daftarKelas === null}
            aria-invalid={Boolean(galat.kelasId)}
            aria-describedby={galat.kelasId ? `${idKolom("kelasId")}-galat` : undefined}
            onChange={(e) => setIsian((l) => ({ ...l, kelasId: e.target.value }))}
          >
            <option value="">{daftarKelas === null ? "Memuat kelas…" : "Pilih kelas"}</option>
            {daftarKelas?.map((k) => (
              <option key={k.id} value={k.id}>
                {namaKelasLengkap(k)}
              </option>
            ))}
          </select>
        </Kolom>
        {daftarKelas?.length === 0 && (
          <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Kamu belum punya kelas.{" "}
            <Link href="/guru" className="underline">
              Buat kelas dulu
            </Link>{" "}
            sebelum membuat soal.
          </p>
        )}
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
            {pengiriman.kode
              ? `Soal tersimpan dan kuis ${pengiriman.namaKelas} sudah dibuka. Kode kuis: ${pengiriman.kode}. `
              : `Soal tersimpan untuk ${pengiriman.namaKelas}, tetapi kuis belum terbuka. Buka dari halaman kelas. `}
            <Link href={`/guru/kelas?kelas=${pengiriman.kelasId}`} className="underline">
              Lihat di Kelola kelas
            </Link>
            .
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {kelasDipilih && (
          <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Menyimpan akan membuka kuis baru untuk {namaKelasLengkap(kelasDipilih)} dan menutup kuis yang sedang aktif di kelas itu.
          </p>
        )}
        <div>
          <Tombol varian="utama" type="submit" ikon={Save} memuat={pengiriman.status === "mengirim"}>
            Simpan soal dan buka kuis
          </Tombol>
        </div>
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
