"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Pencil, Save, Trash2, X } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";
import {
  ambilDaftarKelas,
  ambilDaftarTopik,
  ambilDetailTopik,
  bukaSesi,
  hapusTopik,
  simpanTopik,
  ubahTopik,
} from "@/lib/api-klien";
import { JUMLAH_SOAL_TOPIK, TOPIK_DEMO_ID } from "@/lib/konstanta";
import { skemaBodyTopikBaru, skemaBodyUbahTopik } from "@/lib/skema-api";
import { KODE_PILIHAN, pesanGalatTopik } from "@/lib/soal-guru";
import type { KelasRingkas, KodePilihan, TopikDetail, TopikRingkas } from "@/lib/tipe";

type Empat = [string, string, string, string];
type IsianSoal = { teks: string; pilihan: Empat; kunci: KodePilihan | ""; miskonsepsi: Empat };
type Isian = { kelasId: string; soal: IsianSoal[] };
type ModeUbah = { id: string; nama: string; capaianPembelajaran: string };
type PesanAksi = { jenis: "sukses" | "gagal"; teks: string };
type Pengiriman =
  | { status: "diam" }
  | { status: "mengirim" }
  | { status: "berhasil"; jenis: "buat"; kelasId: string; namaKelas: string; kode: string | null }
  | { status: "berhasil"; jenis: "ubah"; namaTopik: string }
  | { status: "gagal"; pesan: string };

const namaKelasLengkap = (k: KelasRingkas) => `${k.nama} · ${k.mapel}`;

const KELAS_ISIAN = "w-full rounded-kecil border border-tinta/15 bg-white/80 px-3 py-2 text-base leading-relaxed text-tinta";

const soalKosong = (): IsianSoal => ({
  teks: "",
  pilihan: ["", "", "", ""],
  kunci: "",
  miskonsepsi: ["", "", "", ""],
});

const isianKosong = (): Isian => ({
  kelasId: "",
  soal: Array.from({ length: JUMLAH_SOAL_TOPIK }, soalKosong),
});

function isianDariDetail(detail: TopikDetail): Isian {
  const soal: IsianSoal[] = detail.soal
    .slice()
    .sort((a, b) => a.nomor - b.nomor)
    .map((s) => ({
      teks: s.teks,
      pilihan: s.pilihan.map((p) => p.teks) as Empat,
      kunci: s.kunci,
      miskonsepsi: KODE_PILIHAN.map((k) => s.miskonsepsi[k] ?? "") as Empat,
    }));
  while (soal.length < JUMLAH_SOAL_TOPIK) soal.push(soalKosong());
  return { kelasId: "", soal: soal.slice(0, JUMLAH_SOAL_TOPIK) };
}

// PRD F-10, design.md 3.9. Topik yang belum dipakai kuis bisa diubah atau dihapus.
export default function HalamanBuatSoal() {
  const idDasar = useId();
  const [isian, setIsian] = useState<Isian>(isianKosong);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [pengiriman, setPengiriman] = useState<Pengiriman>({ status: "diam" });
  const [daftarKelas, setDaftarKelas] = useState<KelasRingkas[] | null>(null);
  const [galatKelas, setGalatKelas] = useState<string | null>(null);
  const [daftarTopik, setDaftarTopik] = useState<TopikRingkas[] | null>(null);
  const [galatTopik, setGalatTopik] = useState<string | null>(null);
  const [percobaanTopik, setPercobaanTopik] = useState(0);
  const [mengubah, setMengubah] = useState<ModeUbah | null>(null);
  const [memuatDetail, setMemuatDetail] = useState(false);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [pesanAksi, setPesanAksi] = useState<PesanAksi | null>(null);

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

  useEffect(() => {
    let batal = false;
    ambilDaftarTopik()
      .then((daftar) => {
        if (batal) return;
        setDaftarTopik(daftar);
        setGalatTopik(null);
      })
      .catch((err: unknown) => {
        if (!batal) setGalatTopik(err instanceof Error ? err.message : "Daftar topik belum bisa dimuat.");
      });
    return () => {
      batal = true;
    };
  }, [percobaanTopik]);

  const kelasDipilih = daftarKelas?.find((k) => k.id === isian.kelasId) ?? null;

  /** id elemen untuk jalur kolom, misalnya "soal.1.pilihan.2". */
  const idKolom = (jalur: string) => `${idDasar}-${jalur.replaceAll(".", "-")}`;

  function ubahSoal(i: number, ubah: (s: IsianSoal) => IsianSoal) {
    setIsian((lama) => ({ ...lama, soal: lama.soal.map((s, j) => (j === i ? ubah(s) : s)) }));
  }

  function batalUbah() {
    setMengubah(null);
    setIsian(isianKosong());
    setGalat({});
    setPengiriman({ status: "diam" });
    setPesanAksi(null);
  }

  async function mulaiUbah(id: string) {
    setMemuatDetail(true);
    setPesanAksi(null);
    try {
      const detail = await ambilDetailTopik(id);
      if (detail.dipakai) {
        setPesanAksi({
          jenis: "gagal",
          teks: "Topik ini sudah dipakai kuis dan tidak bisa diubah. Buat topik baru untuk versi berbeda.",
        });
        return;
      }
      setMengubah({ id: detail.id, nama: detail.nama, capaianPembelajaran: detail.capaianPembelajaran });
      setIsian(isianDariDetail(detail));
      setGalat({});
      setPengiriman({ status: "diam" });
      setHapusId(null);
      document.getElementById("form-soal")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setPesanAksi({
        jenis: "gagal",
        teks: err instanceof Error ? err.message : "Topik belum bisa dimuat.",
      });
    } finally {
      setMemuatDetail(false);
    }
  }

  async function hapusTopikAksi(id: string) {
    setMenghapus(true);
    setPesanAksi(null);
    try {
      await hapusTopik(id);
      setHapusId(null);
      if (mengubah?.id === id) batalUbah();
      setPesanAksi({ jenis: "sukses", teks: "Topik dihapus." });
      setPercobaanTopik((n) => n + 1);
    } catch (err) {
      setPesanAksi({
        jenis: "gagal",
        teks: err instanceof Error ? err.message : "Topik belum berhasil dihapus.",
      });
    } finally {
      setMenghapus(false);
    }
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (pengiriman.status === "mengirim") return;

    if (mengubah) {
      const hasil = skemaBodyUbahTopik.safeParse({
        id: mengubah.id,
        nama: mengubah.nama,
        capaianPembelajaran: mengubah.capaianPembelajaran,
        soal: isian.soal,
      });
      if (!hasil.success) {
        const pesan = pesanGalatTopik(hasil);
        setGalat(pesan);
        setPengiriman({ status: "diam" });
        document.getElementById(idKolom(Object.keys(pesan)[0]))?.focus();
        return;
      }

      setGalat({});
      setPengiriman({ status: "mengirim" });
      try {
        await ubahTopik(hasil.data);
        setPengiriman({ status: "berhasil", jenis: "ubah", namaTopik: hasil.data.nama });
        setMengubah(null);
        setIsian(isianKosong());
        setPercobaanTopik((n) => n + 1);
      } catch (err) {
        setPengiriman({
          status: "gagal",
          pesan: err instanceof Error ? err.message : "Perubahan topik belum tersimpan.",
        });
      }
      return;
    }

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
      setPengiriman({ status: "berhasil", jenis: "buat", kelasId: kelas.id, namaKelas: namaKelasLengkap(kelas), kode });
      setPercobaanTopik((n) => n + 1);
    } catch (err) {
      setPengiriman({ status: "gagal", pesan: err instanceof Error ? err.message : "Soal belum berhasil disimpan." });
    }
  }

  return (
    <div className="flex flex-col gap-6" id="form-soal">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">{mengubah ? "Ubah soal" : "Buat soal"}</h1>
        <p className="text-base leading-snug font-semibold">
          {mengubah
            ? `Perbarui nama topik, capaian, dan tepat ${JUMLAH_SOAL_TOPIK} soal. Menyimpan tidak membuka kuis baru.`
            : `Pilih kelas, lalu tulis tepat ${JUMLAH_SOAL_TOPIK} soal pilihan ganda. Setelah disimpan, soal langsung menjadi kuis untuk kelas itu.`}
        </p>
      </header>

      <KartuKaca as="section" className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-xl leading-snug font-semibold">
            <BookOpen aria-hidden="true" className="size-5 text-primer" />
            Topik tersimpan
          </h2>
          <p className="text-tinta-lembut">Topik yang belum dipakai kuis bisa diubah atau dihapus.</p>
        </div>

        {galatTopik && (
          <p role="alert" className="font-medium text-belum-teks">
            {galatTopik}
          </p>
        )}

        {!daftarTopik ? (
          <p className="text-tinta-lembut">Memuat topik…</p>
        ) : daftarTopik.length === 0 ? (
          <p className="text-tinta-lembut">Belum ada topik.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-tinta/10">
            {daftarTopik.map((t) => {
              const demo = t.id === TOPIK_DEMO_ID;
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0 font-semibold">
                    {t.nama}
                    {demo && (
                      <span className="ml-2 rounded-full bg-tinta/5 px-2 py-0.5 text-[11px] leading-normal font-medium text-tinta-lembut">
                        Topik demo
                      </span>
                    )}
                  </span>

                  {demo ? (
                    <span className="text-[12px] leading-normal text-tinta-lembut">Topik bersama</span>
                  ) : hapusId === t.id ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] leading-normal font-medium text-tinta-lembut">Hapus topik ini?</span>
                      <button
                        type="button"
                        disabled={menghapus}
                        onClick={() => void hapusTopikAksi(t.id)}
                        className="rounded-full bg-belum-latar px-2.5 py-1 text-[12px] leading-normal font-semibold text-belum-teks disabled:opacity-60"
                      >
                        {menghapus ? "Menghapus…" : "Ya, hapus"}
                      </button>
                      <button
                        type="button"
                        disabled={menghapus}
                        onClick={() => setHapusId(null)}
                        className="rounded-full px-2.5 py-1 text-[12px] leading-normal font-semibold text-tinta-lembut hover:bg-tinta/5"
                      >
                        Batal
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={memuatDetail}
                        onClick={() => void mulaiUbah(t.id)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[12px] leading-normal font-semibold text-primer hover:bg-primer-lembut disabled:opacity-60"
                      >
                        <Pencil aria-hidden="true" className="size-3.5" />
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => setHapusId(t.id)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[12px] leading-normal font-semibold text-belum-teks hover:bg-belum-latar"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        Hapus
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {pesanAksi && (
          <p
            role={pesanAksi.jenis === "gagal" ? "alert" : "status"}
            className={`text-[13px] leading-normal font-medium ${
              pesanAksi.jenis === "gagal" ? "text-belum-teks" : "text-sudah-teks"
            }`}
          >
            {pesanAksi.teks}
          </p>
        )}
      </KartuKaca>

      <form noValidate onSubmit={(e) => void simpan(e)} className="flex flex-col gap-6">
        {mengubah ? (
          <KartuKaca className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl leading-snug font-semibold">Mengubah topik</h2>
                <p className="text-tinta-lembut">Topik ini belum dipakai kuis, jadi aman diperbarui.</p>
              </div>
              <Tombol varian="teks" type="button" ikon={X} onClick={batalUbah}>
                Batal ubah
              </Tombol>
            </div>

            <Kolom id={idKolom("nama")} label="Nama topik" galat={galat.nama}>
              <input
                id={idKolom("nama")}
                className={KELAS_ISIAN}
                value={mengubah.nama}
                aria-invalid={Boolean(galat.nama)}
                aria-describedby={galat.nama ? `${idKolom("nama")}-galat` : undefined}
                onChange={(e) => setMengubah({ ...mengubah, nama: e.target.value })}
              />
            </Kolom>

            <Kolom
              id={idKolom("capaianPembelajaran")}
              label="Capaian pembelajaran"
              galat={galat.capaianPembelajaran}
            >
              <textarea
                id={idKolom("capaianPembelajaran")}
                rows={3}
                className={KELAS_ISIAN}
                value={mengubah.capaianPembelajaran}
                aria-invalid={Boolean(galat.capaianPembelajaran)}
                aria-describedby={
                  galat.capaianPembelajaran ? `${idKolom("capaianPembelajaran")}-galat` : undefined
                }
                onChange={(e) => setMengubah({ ...mengubah, capaianPembelajaran: e.target.value })}
              />
            </Kolom>
          </KartuKaca>
        ) : (
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
        )}

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
            {pengiriman.jenis === "ubah" ? (
              `Perubahan topik ${pengiriman.namaTopik} tersimpan.`
            ) : pengiriman.kode ? (
              <>
                Soal tersimpan dan kuis {pengiriman.namaKelas} sudah dibuka. Kode kuis: {pengiriman.kode}.{" "}
                <Link href={`/guru/kelas?kelas=${pengiriman.kelasId}`} className="underline">
                  Lihat di Kelola kelas
                </Link>
                .
              </>
            ) : (
              <>
                Soal tersimpan untuk {pengiriman.namaKelas}, tetapi kuis belum terbuka. Buka dari halaman kelas.{" "}
                <Link href={`/guru/kelas?kelas=${pengiriman.kelasId}`} className="underline">
                  Lihat di Kelola kelas
                </Link>
                .
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {mengubah ? (
          <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Menyimpan hanya memperbarui topik. Kuis yang sudah ada tidak berubah.
          </p>
        ) : (
          kelasDipilih && (
            <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Menyimpan akan membuka kuis baru untuk {namaKelasLengkap(kelasDipilih)} dan menutup kuis yang sedang aktif di kelas itu.
            </p>
          )
        )}
        <div>
          <Tombol varian="utama" type="submit" ikon={Save} memuat={pengiriman.status === "mengirim"}>
            {mengubah ? "Simpan perubahan" : "Simpan soal dan buka kuis"}
          </Tombol>
        </div>
      </div>
      </form>
    </div>
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
