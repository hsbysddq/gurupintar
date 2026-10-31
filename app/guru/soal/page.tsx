"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CircleCheck,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Save,
  School,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  ambilDaftarKelas,
  ambilDaftarTopik,
  ambilDetailTopik,
  bukaSesi,
  hapusTopik,
  simpanTopik,
  ubahTopik,
} from "@/lib/api-klien";
import { SOAL_AWAL_TOPIK, SOAL_MINIMAL_TOPIK, TOPIK_DEMO_ID } from "@/lib/konstanta";
import { skemaBodyTopikBaru, skemaBodyUbahTopik } from "@/lib/skema-api";
import { KODE_PILIHAN, pesanGalatTopik } from "@/lib/soal-guru";
import type { KelasRingkas, KodePilihan, TopikDetail, TopikRingkas } from "@/lib/tipe";

type Empat = [string, string, string, string];
type IsianSoal = { teks: string; pilihan: Empat; kunci: KodePilihan | ""; miskonsepsi: Empat };
type Isian = { kelasId: string; nama: string; soal: IsianSoal[] };
type ModeUbah = { id: string; nama: string; capaianPembelajaran: string };
type PesanAksi = { jenis: "sukses" | "gagal"; teks: string };
type Pengiriman =
  | { status: "diam" }
  | { status: "mengirim" }
  | { status: "berhasil"; jenis: "buat"; kelasId: string; namaKelas: string; kode: string | null }
  | { status: "berhasil"; jenis: "ubah"; namaTopik: string }
  | { status: "gagal"; pesan: string };

const namaKelasLengkap = (k: KelasRingkas) => `${k.nama} · ${k.mapel}`;

const KELAS_ISIAN =
  "w-full rounded-2xl border border-white/70 bg-white/65 px-3.5 py-2.5 font-body text-base leading-relaxed text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85";

const soalKosong = (): IsianSoal => ({
  teks: "",
  pilihan: ["", "", "", ""],
  kunci: "",
  miskonsepsi: ["", "", "", ""],
});

const isianKosong = (): Isian => ({
  kelasId: "",
  nama: "",
  soal: Array.from({ length: SOAL_AWAL_TOPIK }, soalKosong),
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
  while (soal.length === 0) soal.push(soalKosong());
  return { kelasId: "", nama: "", soal };
}

// PRD F-10, design.md 3.9. Topik yang belum dipakai kuis bisa diubah atau dihapus.
export default function HalamanBuatSoal() {
  const idDasar = useId();
  const [isian, setIsian] = useState<Isian>(isianKosong);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [pengiriman, setPengiriman] = useState<Pengiriman>({ status: "diam" });
  const [daftarKelas, setDaftarKelas] = useState<KelasRingkas[] | null>(null);
  const [galatKelas, setGalatKelas] = useState<string | null>(null);
  const [dariKelas, setDariKelas] = useState(false);
  const [daftarTopik, setDaftarTopik] = useState<TopikRingkas[] | null>(null);
  const [galatTopik, setGalatTopik] = useState<string | null>(null);
  const [percobaanTopik, setPercobaanTopik] = useState(0);
  const [mengubah, setMengubah] = useState<ModeUbah | null>(null);
  const [memuatDetail, setMemuatDetail] = useState(false);
  const [memuatDetailId, setMemuatDetailId] = useState<string | null>(null);
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
        const params = new URLSearchParams(window.location.search);
        const kelasId = params.get("kelas");
        if (params.get("dari") === "kelas") setDariKelas(true);
        if (kelasId && daftar.some((k) => k.id === kelasId)) {
          setIsian((lama) => ({ ...lama, kelasId }));
        } else if (daftar.length === 1) {
          setIsian((lama) => ({ ...lama, kelasId: daftar[0].id }));
        }
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

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("dari") !== "kelas") return;
    document.getElementById("form-soal")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const kelasDipilih = daftarKelas?.find((k) => k.id === isian.kelasId) ?? null;

  /** id elemen untuk jalur kolom, misalnya "soal.1.pilihan.2". */
  const idKolom = (jalur: string) => `${idDasar}-${jalur.replaceAll(".", "-")}`;

  function ubahSoal(i: number, ubah: (s: IsianSoal) => IsianSoal) {
    setIsian((lama) => ({ ...lama, soal: lama.soal.map((s, j) => (j === i ? ubah(s) : s)) }));
  }

  function tambahSoal() {
    setIsian((lama) => ({ ...lama, soal: [...lama.soal, soalKosong()] }));
  }

  function hapusSoal(i: number) {
    setIsian((lama) => {
      if (lama.soal.length <= SOAL_MINIMAL_TOPIK) return lama;
      return { ...lama, soal: lama.soal.filter((_, j) => j !== i) };
    });
    setGalat({});
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
    setMemuatDetailId(id);
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
      setMemuatDetailId(null);
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
    // Nama topik diisi guru; capaian pembelajaran mengikuti kelas yang dipilih.
    const hasil = skemaBodyTopikBaru.safeParse({
      nama: isian.nama,
      capaianPembelajaran: kelas ? `Soal buatan guru untuk mata pelajaran ${kelas.mapel}, ${kelas.nama}.`.slice(0, 300) : "",
      soal: isian.soal,
    });

    const pesan: Record<string, string> = hasil.success ? {} : pesanGalatTopik(hasil);
    delete pesan.capaianPembelajaran;
    if (!kelas) Object.assign(pesan, { kelasId: "Pilih kelas dulu." });
    if (!hasil.success || !kelas) {
      const urut = kelas ? pesan : { ...pesan, kelasId: pesan.kelasId };
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
    <div className="relative isolate -mx-4 -my-6 flex flex-col gap-6 overflow-x-clip bg-aura-canvas px-4 py-6 md:-m-8 md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-aura-primary/10 blur-[100px]" />
        <div className="absolute -right-20 top-40 size-72 rounded-full bg-aura-violet/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-[#FB923C]/10 blur-[100px]" />
      </div>

      <header className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            {dariKelas && isian.kelasId && (
              <Link
                href={`/guru/kelas?kelas=${isian.kelasId}`}
                className="inline-flex w-fit items-center font-display text-[12px] font-semibold text-aura-muted transition-colors hover:text-aura-primary"
              >
                ← Kembali ke kelas
              </Link>
            )}
            <span className="aura-eyebrow">
              <Sparkles aria-hidden="true" className="size-3.5" />
              {dariKelas ? "Kuis baru" : "Bank soal"}
            </span>
            <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
              {mengubah ? "Ubah topik" : dariKelas ? "Buat soal kuis" : "Bank soal"}
            </h1>
            <p className="font-body text-[14px] leading-[22px] text-aura-muted">
              {mengubah
                ? "Perbarui nama topik, capaian, dan soal. Menyimpan tidak membuka kuis baru."
                : dariKelas
                  ? "Tambahkan soal sesuai kebutuhan. Kuis baru terbuka untuk siswa setelah soal disimpan."
                  : "Tentukan nama topik, pilih kelas, lalu tulis soal pilihan ganda. Tambahkan soal sesuai kebutuhan. Setelah disimpan, soal langsung menjadi kuis untuk kelas itu."}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {!dariKelas && (
                <span className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                  <BookOpen aria-hidden="true" className="size-4 text-aura-primary" />
                  {daftarTopik ? `${daftarTopik.length} topik` : "Memuat topik"}
                </span>
              )}
              <span className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                <ListChecks aria-hidden="true" className="size-4 text-aura-indigo" />
                Soal bisa ditambah
              </span>
            </div>
          </div>

          {!mengubah && !dariKelas && (
            <a href="#form-soal" className="aura-btn aura-btn-primary h-12 w-full shrink-0 px-5 text-[14px] sm:w-auto">
              <Plus aria-hidden="true" className="size-4" />
              Buat topik
            </a>
          )}
        </div>
      </header>

      {!dariKelas && (
      <section aria-labelledby="judul-topik" className="aura-glass rounded-[24px] p-2 sm:p-3">
        <div className="flex flex-wrap items-start justify-between gap-3 px-3 pt-3 sm:px-2">
          <div className="flex flex-col gap-1">
            <span className="aura-eyebrow">Topik tersimpan</span>
            <h2 id="judul-topik" className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
              Topik tersedia
            </h2>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Topik yang belum dipakai kuis bisa diubah atau dihapus.
            </p>
          </div>
          <span className="font-body text-[12px] leading-[18px] text-aura-muted">
            {daftarTopik ? `${daftarTopik.length} topik` : "Memuat…"}
          </span>
        </div>

        {galatTopik && <PesanJenis jenis="gagal" teks={galatTopik} />}

        {!daftarTopik ? (
          <div className="flex items-center gap-2 px-3 py-6 font-body text-[13px] text-aura-muted sm:px-2">
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-aura-primary" />
            Memuat topik…
          </div>
        ) : daftarTopik.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center sm:px-2">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Belum ada topik. Buat topik pertamamu dari form di bawah.
            </p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 p-1 sm:p-2">
            {daftarTopik.map((t) => {
              const demo = t.id === TOPIK_DEMO_ID;
              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 rounded-[18px] border border-white/55 bg-white/45 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary/10 to-aura-violet/15 text-aura-primary ring-1 ring-white/70">
                      <BookOpen aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-display text-[14px] leading-[22px] font-semibold text-aura-ink">{t.nama}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {demo ? (
                          <span className="rounded-full bg-aura-primary/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-primary">
                            Topik demo
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/60 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                            Topik tersimpan
                          </span>
                        )}
                        <span className="font-body text-[11px] leading-[16px] text-aura-muted">{t.jumlahSoal} soal</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    {demo ? (
                      <span className="font-display text-[11px] font-semibold text-aura-muted">Topik bersama</span>
                    ) : hapusId === t.id ? (
                      <>
                        <span className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">Hapus topik ini?</span>
                        <button
                          type="button"
                          disabled={menghapus}
                          aria-busy={menghapus || undefined}
                          onClick={() => void hapusTopikAksi(t.id)}
                          className="aura-btn aura-btn-danger h-11 px-3 text-[12px] disabled:opacity-60"
                        >
                          {menghapus && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
                          {menghapus ? "Menghapus…" : "Ya, hapus"}
                        </button>
                        <button
                          type="button"
                          disabled={menghapus}
                          onClick={() => setHapusId(null)}
                          className="aura-btn aura-btn-secondary h-11 px-3 text-[12px] disabled:opacity-60"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={memuatDetail}
                          aria-busy={memuatDetailId === t.id || undefined}
                          onClick={() => void mulaiUbah(t.id)}
                          className="aura-btn aura-btn-secondary h-11 px-3 text-[12px] disabled:opacity-60"
                        >
                          {memuatDetailId === t.id ? (
                            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                          ) : (
                            <Pencil aria-hidden="true" className="size-3.5" />
                          )}
                          {memuatDetailId === t.id ? "Memuat…" : "Ubah"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHapusId(t.id)}
                          className="aura-btn aura-btn-danger h-11 px-3 text-[12px]"
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" />
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pesanAksi && <PesanJenis jenis={pesanAksi.jenis === "gagal" ? "gagal" : "sukses"} teks={pesanAksi.teks} />}
      </section>
      )}

      <form id="form-soal" noValidate onSubmit={(e) => void simpan(e)} className="flex scroll-mt-28 flex-col gap-6">
        {mengubah ? (
          <section className="aura-glass rounded-[24px] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="aura-eyebrow">Mode ubah</span>
                <h2 className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
                  Mengubah topik
                </h2>
                <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                  Topik ini belum dipakai kuis, jadi aman diperbarui.
                </p>
              </div>
              <button type="button" onClick={batalUbah} className="aura-btn aura-btn-secondary h-11 px-4 text-[13px]">
                <X aria-hidden="true" className="size-4" />
                Batal ubah
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
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
            </div>
          </section>
        ) : (
          <section className="aura-glass rounded-[24px] p-5 sm:p-6">
            <div className="flex flex-col gap-1">
              <span className="aura-eyebrow">Topik baru</span>
              <h2 className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
                {dariKelas ? "Topik dan soal" : "Tentukan topik dan kelas"}
              </h2>
              <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                Nama topik kamu tentukan sendiri. Capaian pembelajaran mengikuti kelas yang dipilih.
              </p>
            </div>

            {dariKelas && kelasDipilih && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-aura-primary/20 bg-aura-primary/5 px-4 py-3 font-body text-[13px] leading-[20px] text-aura-ink">
                <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aura-primary" />
                <p>
                  Kuis baru belum bisa diakses siswa. Isi nama topik dan soal di bawah, lalu simpan untuk membuka
                  kuis untuk <strong>{namaKelasLengkap(kelasDipilih)}</strong>.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-4">
              <Kolom id={idKolom("nama")} label="Nama topik" galat={galat.nama}>
                <input
                  id={idKolom("nama")}
                  className={KELAS_ISIAN}
                  value={isian.nama}
                  maxLength={80}
                  placeholder="Misalnya: Pecahan senilai"
                  aria-invalid={Boolean(galat.nama)}
                  aria-describedby={galat.nama ? `${idKolom("nama")}-galat` : undefined}
                  onChange={(e) => setIsian((l) => ({ ...l, nama: e.target.value }))}
                />
              </Kolom>

              {dariKelas && kelasDipilih ? (
                <div className="flex flex-col gap-1.5">
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                    Kelas dan mata pelajaran
                  </span>
                  <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/70 bg-white/45 px-3.5 font-body text-[14px] text-aura-ink">
                    <School aria-hidden="true" className="size-4 shrink-0 text-aura-primary" />
                    {namaKelasLengkap(kelasDipilih)}
                  </div>
                </div>
              ) : (
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
              )}
              {daftarKelas?.length === 0 && (
                <p className="font-body text-[13px] leading-[20px] font-medium text-aura-muted">
                  Kamu belum punya kelas.{" "}
                  <Link href="/guru" className="font-semibold text-aura-primary underline">
                    Buat kelas dulu
                  </Link>{" "}
                  sebelum membuat soal.
                </p>
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="judul-soal" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="aura-eyebrow">Soal</span>
              <h2 id="judul-soal" className="mt-2 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
                {isian.soal.length} soal pilihan ganda
              </h2>
              <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
                Lengkapi teks soal, empat pilihan, kunci jawaban, dan kesalahan pemahaman tiap pengecoh.
              </p>
            </div>
            <button
              type="button"
              onClick={tambahSoal}
              className="aura-btn aura-btn-secondary h-10 px-3 text-[12px]"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              Tambah soal
            </button>
          </div>

          {isian.soal.map((s, i) => {
            const jalur = (kolom: string) => `soal.${i}.${kolom}`;
            const propsGalat = (kolom: string) => ({
              "aria-invalid": Boolean(galat[jalur(kolom)]),
              "aria-describedby": galat[jalur(kolom)] ? `${idKolom(jalur(kolom))}-galat` : undefined,
            });
            return (
              <article key={i} className="aura-glass rounded-[24px] p-5 sm:p-6">
                <fieldset className="flex flex-col gap-5">
                  <legend className="flex w-full flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aura-primary to-aura-primary-deep font-display text-[13px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]">
                        {i + 1}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                          Soal {i + 1}
                        </span>
                        <span className="font-display text-[16px] leading-[24px] font-semibold text-aura-ink">
                          Pilihan ganda
                        </span>
                      </span>
                    </span>
                    {isian.soal.length > SOAL_MINIMAL_TOPIK && (
                      <button
                        type="button"
                        onClick={() => hapusSoal(i)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-aura-red/20 bg-aura-red/5 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-[#93000a] transition-colors hover:bg-aura-red/10"
                      >
                        <Trash2 aria-hidden="true" className="size-3" />
                        Hapus
                      </button>
                    )}
                  </legend>

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
                      <Kolom
                        key={kode}
                        id={idKolom(jalur(`pilihan.${j}`))}
                        label={`Pilihan ${kode}`}
                        galat={galat[jalur(`pilihan.${j}`)]}
                      >
                        <input
                          id={idKolom(jalur(`pilihan.${j}`))}
                          className={KELAS_ISIAN}
                          value={s.pilihan[j]}
                          {...propsGalat(`pilihan.${j}`)}
                          onChange={(e) =>
                            ubahSoal(i, (x) => ({
                              ...x,
                              pilihan: x.pilihan.map((p, k) => (k === j ? e.target.value : p)) as Empat,
                            }))
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
                    <legend className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                      Kunci jawaban
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {KODE_PILIHAN.map((kode) => (
                        <label
                          key={kode}
                          className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-full border px-4 font-display text-[14px] font-semibold transition-colors ${
                            s.kunci === kode
                              ? "border-transparent bg-gradient-to-r from-aura-primary to-aura-primary-deep text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]"
                              : "border-aura-primary/20 bg-white/70 text-aura-ink shadow-sm hover:bg-white/90 hover:text-aura-primary"
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
                      <p id={`${idKolom(jalur("kunci"))}-galat`} className="font-body text-[12px] leading-[18px] font-medium text-[#93000a]">
                        {galat[jalur("kunci")]}
                      </p>
                    )}
                  </fieldset>

                  <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/35 p-3">
                    <p className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">
                      Kesalahan pemahaman jika siswa memilih jawaban salah (opsional). Dipakai untuk menyusun materi lanjutan.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
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
                  </div>
                </fieldset>
              </article>
            );
          })}

          <button
            type="button"
            onClick={tambahSoal}
            className="aura-btn aura-btn-secondary mt-1 h-12 w-full px-4 text-[14px] sm:w-auto"
          >
            <Plus aria-hidden="true" className="size-4" />
            Tambah soal
          </button>
        </section>

        <section className="aura-glass rounded-[24px] p-5 sm:p-6">
          <div aria-live="polite" className="flex flex-col gap-3">
            {Object.keys(galat).length > 0 && (
              <PesanJenis jenis="gagal" teks="Ada isian yang belum sesuai. Periksa kolom yang ditandai." />
            )}
            {pengiriman.status === "gagal" && <PesanJenis jenis="gagal" teks={pengiriman.pesan} />}
            {pengiriman.status === "berhasil" && (
              <PesanJenis
                jenis="sukses"
                teks={
                  pengiriman.jenis === "ubah" ? (
                    `Perubahan topik ${pengiriman.namaTopik} tersimpan.`
                  ) : pengiriman.kode ? (
                    <>
                      Soal tersimpan dan kuis {pengiriman.namaKelas} sudah dibuka. Kode kuis: {pengiriman.kode}.{" "}
                      <Link href={`/guru/kelas?kelas=${pengiriman.kelasId}`} className="font-semibold underline">
                        Lihat di Kelola kelas
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Soal tersimpan untuk {pengiriman.namaKelas}, tetapi kuis belum terbuka. Buka dari halaman kelas.{" "}
                      <Link href={`/guru/kelas?kelas=${pengiriman.kelasId}`} className="font-semibold underline">
                        Lihat di Kelola kelas
                      </Link>
                      .
                    </>
                  )
                }
              />
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">
              {mengubah
                ? "Menyimpan hanya memperbarui topik. Kuis yang sudah ada tidak berubah."
                : kelasDipilih
                  ? `Menyimpan akan membuka kuis baru untuk ${namaKelasLengkap(kelasDipilih)} dan menutup kuis yang sedang aktif di kelas itu.`
                  : "Pilih kelas terlebih dahulu sebelum menyimpan soal."}
            </p>
            <button
              type="submit"
              disabled={pengiriman.status === "mengirim"}
              className="aura-btn aura-btn-primary h-[52px] w-full px-6 text-[15px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {pengiriman.status === "mengirim" ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              {mengubah ? "Simpan perubahan" : "Simpan soal dan buka kuis"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

type KolomProps = { id: string; label: string; galat?: string; children: ReactNode };

function Kolom({ id, label, galat, children }: KolomProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
        {label}
      </label>
      {children}
      {galat && (
        <p id={`${id}-galat`} className="font-body text-[12px] leading-[18px] font-medium text-[#93000a]">
          {galat}
        </p>
      )}
    </div>
  );
}

function PesanJenis({ jenis, teks }: { jenis: "sukses" | "gagal"; teks: ReactNode }) {
  const sukses = jenis === "sukses";
  return (
    <div
      role={sukses ? "status" : "alert"}
      className={`mt-3 flex items-start gap-2 rounded-2xl border px-3 py-2.5 font-body text-[12px] leading-[18px] font-medium ${
        sukses
          ? "border-aura-emerald/20 bg-aura-emerald/10 text-[#047857]"
          : "border-aura-red/20 bg-aura-red/5 text-[#93000a]"
      }`}
    >
      {sukses ? (
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{teks}</span>
    </div>
  );
}
