"use client";

import { Suspense, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CircleCheck,
  FileText,
  FileUp,
  Headphones,
  Loader2,
  Pencil,
  PlayCircle,
  Presentation,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { TabMateriSiswa } from "@/components/TabMateriSiswa";
import {
  ambilDaftarKelas,
  ambilMateriPustaka,
  simpanMateriPustaka,
  ubahMateriPustaka,
  ubahModul,
  ubahModulPdf,
} from "@/lib/api-klien";
import { PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN, UKURAN_PDF_MAKS_BYTE } from "@/lib/konstanta";
import { unduhDocx, unduhPptx } from "@/lib/unduh-materi";
import type { IsiMateri, KelasRingkas, SumberMateri } from "@/lib/tipe";

type Keadaan =
  | { status: "diam" }
  | { status: "memuat" }
  | { status: "gagal"; pesan: string }
  | { status: "siap"; isi: IsiMateri; nomor: number };

type Sumber = "teks" | "pdf";

const BENTUK: { label: string; ikon: LucideIcon }[] = [
  { label: "Video", ikon: PlayCircle },
  { label: "Audio", ikon: Headphones },
  { label: "Bacaan", ikon: FileText },
  { label: "PPT", ikon: Presentation },
  { label: "Latihan", ikon: Pencil },
];

const KELAS_ISIAN =
  "w-full rounded-2xl border border-white/70 bg-white/65 px-3.5 py-3 font-body text-base leading-relaxed text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85";

function bacaSebagaiBase64(file: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result).split(",")[1] ?? "");
    pembaca.onerror = () => gagal(new Error("File belum bisa dibaca. Coba pilih file lagi."));
    pembaca.readAsDataURL(file);
  });
}

function ukuranBerkas(byte: number) {
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

// PRD F-9, design.md 3.8. Hasil bisa disimpan ke pustaka materi kelas.
export default function HalamanUbahModul() {
  return (
    <Suspense fallback={null}>
      <IsiHalamanUbahModul />
    </Suspense>
  );
}

function IsiHalamanUbahModul() {
  const idDasar = useId();
  const router = useRouter();
  const params = useSearchParams();
  const [teks, setTeks] = useState("");
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "diam" });
  const [nomor, setNomor] = useState(0);
  const [sumber, setSumber] = useState<Sumber>("teks");
  const [berkas, setBerkas] = useState<File | null>(null);
  const [galatBerkas, setGalatBerkas] = useState<string | null>(null);
  const [mengunduh, setMengunduh] = useState<"pptx" | "docx" | null>(null);
  const [daftarKelas, setDaftarKelas] = useState<KelasRingkas[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [bab, setBab] = useState("");
  const [materiId, setMateriId] = useState<string | null>(null);
  const [sumberMateri, setSumberMateri] = useState<SumberMateri>("ai");
  const [asalMateri, setAsalMateri] = useState<Sumber>("teks");
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);
  const [memuatAwal, setMemuatAwal] = useState(true);
  const [galatAwal, setGalatAwal] = useState<string | null>(null);
  const kelasAwalParam = params.get("kelas");
  const materiAwalParam = params.get("materi");

  // Dihitung setelah spasi di awal dan akhir dibuang, sama dengan skema di server.
  const panjang = teks.trim().length;
  const panjangSesuai = panjang >= PANJANG_MODUL_MIN && panjang <= PANJANG_MODUL_MAKS;
  const memuat = keadaan.status === "memuat";
  const siapKirim = sumber === "teks" ? panjangSesuai : berkas !== null;
  const kelasTerpilih = daftarKelas.find((k) => k.id === kelasId);
  const bisaSimpan = kelasId !== "" && bab.trim().length > 0 && keadaan.status === "siap";

  useEffect(() => {
    let aktif = true;

    (async () => {
      try {
        const kelas = await ambilDaftarKelas();
        if (!aktif) return;
        setDaftarKelas(kelas);
        if (kelasAwalParam && kelas.some((k) => k.id === kelasAwalParam)) setKelasId(kelasAwalParam);
        else if (!materiAwalParam && kelas.length === 1) setKelasId(kelas[0].id);

        if (materiAwalParam) {
          const materi = await ambilMateriPustaka(materiAwalParam);
          if (!aktif) return;
          setMateriId(materi.id);
          setKelasId(materi.kelasId);
          setBab(materi.bab);
          setSumberMateri(materi.sumber);
          setKeadaan({ status: "siap", isi: materi.isi, nomor: 1 });
        }
      } catch (err) {
        if (aktif) setGalatAwal(err instanceof Error ? err.message : "Data materi belum bisa dimuat.");
      } finally {
        if (aktif) setMemuatAwal(false);
      }
    })();

    return () => {
      aktif = false;
    };
  }, [kelasAwalParam, materiAwalParam]);

  function pilihBerkas(file: File | null) {
    setGalatBerkas(null);
    if (!file) return setBerkas(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setBerkas(null);
      return setGalatBerkas("File harus berupa PDF.");
    }
    if (file.size > UKURAN_PDF_MAKS_BYTE) {
      setBerkas(null);
      return setGalatBerkas("Ukuran PDF maksimal 5 MB.");
    }
    setBerkas(file);
  }

  async function unduh(jenis: "pptx" | "docx", isi: IsiMateri) {
    setMengunduh(jenis);
    try {
      await (jenis === "pptx" ? unduhPptx(isi) : unduhDocx(isi));
    } finally {
      setMengunduh(null);
    }
  }

  async function ubah() {
    if (!siapKirim || memuat) return;
    setKeadaan({ status: "memuat" });
    setTersimpan(false);
    setGalatSimpan(null);
    try {
      const hasil =
        sumber === "teks" ? await ubahModul(teks) : await ubahModulPdf(await bacaSebagaiBase64(berkas!));
      const { isi, sumber: sumberHasil } = hasil;
      setSumberMateri(sumberHasil);
      setAsalMateri(sumber);
      // Nomor baru memasang ulang pratinjau agar tab dan jawaban latihan kembali ke awal.
      const berikut = nomor + 1;
      setNomor(berikut);
      setKeadaan({ status: "siap", isi, nomor: berikut });
    } catch (err) {
      setKeadaan({ status: "gagal", pesan: err instanceof Error ? err.message : "Materi belum berhasil dibuat." });
    }
  }

  async function simpan() {
    if (keadaan.status !== "siap" || menyimpan) return;
    if (!kelasId) {
      setGalatSimpan("Pilih kelas tujuan terlebih dahulu.");
      return;
    }
    const babBersih = bab.trim();
    if (babBersih.length === 0) {
      setGalatSimpan("Isi bab atau topik materi terlebih dahulu.");
      return;
    }

    setMenyimpan(true);
    setTersimpan(false);
    setGalatSimpan(null);
    try {
      if (materiId) {
        const hasil = await ubahMateriPustaka({
          id: materiId,
          bab: babBersih,
          judul: keadaan.isi.judul,
          isi: keadaan.isi,
        });
        setMateriId(hasil.id);
      } else {
        const hasil = await simpanMateriPustaka({
          kelasId,
          bab: babBersih,
          judul: keadaan.isi.judul,
          isi: keadaan.isi,
          sumber: sumberMateri,
          asal: asalMateri,
        });
        setMateriId(hasil.id);
      }
      setTersimpan(true);
    } catch (err) {
      setGalatSimpan(err instanceof Error ? err.message : "Materi belum berhasil disimpan.");
    } finally {
      setMenyimpan(false);
    }
  }

  function mulaiBaru() {
    setMateriId(null);
    setKeadaan({ status: "diam" });
    setTeks("");
    setBerkas(null);
    setBab("");
    setTersimpan(false);
    setGalatSimpan(null);
    router.replace(`/guru/modul${kelasId ? `?kelas=${kelasId}` : ""}`);
  }

  return (
    <div className="relative isolate -mx-4 -my-6 flex flex-col gap-6 overflow-x-clip bg-aura-canvas px-4 py-6 md:-m-8 md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-aura-primary/10 blur-[100px]" />
        <div className="absolute -right-20 top-40 size-72 rounded-full bg-aura-violet/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-[#FB923C]/10 blur-[100px]" />
      </div>

      <header className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <span className="aura-eyebrow self-start">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Ubah modul
            </span>
            <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
              Ubah modul
            </h1>
            <p className="font-body text-[14px] leading-[22px] text-aura-muted">
              Tempelkan teks atau unggah PDF modul, ubah menjadi video, audio, bacaan, PPT, dan latihan, lalu simpan
              hasilnya ke materi kelas.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                <Sparkles aria-hidden="true" className="size-4 text-aura-primary" />
                4 bentuk belajar
              </span>
              <span className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                <FileText aria-hidden="true" className="size-4 text-aura-indigo" />
                {PANJANG_MODUL_MIN}–{PANJANG_MODUL_MAKS} karakter
              </span>
              <span className="aura-glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[12px] font-semibold text-aura-ink">
                <FileUp aria-hidden="true" className="size-4 text-aura-violet" />
                PDF maks 5 MB
              </span>
            </div>
          </div>

          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:max-w-[252px]">
            {BENTUK.map(({ label, ikon: Ikon }) => (
              <span
                key={label}
                className="flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-[20px] border border-aura-primary/10 bg-white/45 px-3 py-2 text-center backdrop-blur-sm"
              >
                <Ikon aria-hidden="true" className="size-4 text-aura-primary" />
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-ink">
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-14 -top-16 size-40 rounded-full bg-aura-violet/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="aura-eyebrow self-start">
              <BookOpen aria-hidden="true" className="size-3.5" />
              Tujuan materi
            </span>
            <h2 className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
              Simpan ke kelas mana?
            </h2>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Pilih kelas dan isi bab/topik. Materi baru tersimpan setelah kamu menekan tombol Simpan di pratinjau.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                Kelas
              </span>
              <select
                value={kelasId}
                onChange={(e) => {
                  setKelasId(e.target.value);
                  setTersimpan(false);
                  setGalatSimpan(null);
                }}
                disabled={Boolean(materiId) || memuatAwal}
                className={`${KELAS_ISIAN} min-h-12 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="">Pilih kelas</option>
                {daftarKelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.mapel} — {k.nama}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                Bab / topik
              </span>
              <input
                value={bab}
                onChange={(e) => {
                  setBab(e.target.value);
                  setTersimpan(false);
                  setGalatSimpan(null);
                }}
                maxLength={80}
                placeholder="Misalnya: Bab 3 — Teks Deskripsi"
                className={`${KELAS_ISIAN} min-h-12`}
              />
            </label>
          </div>

          {memuatAwal && (
            <p className="flex items-center gap-1.5 font-body text-[12px] leading-[18px] font-medium text-aura-muted">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Memuat daftar kelas...
            </p>
          )}
          {!memuatAwal && daftarKelas.length === 0 && (
            <p className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">
              Belum ada kelas. Buat kelas dulu di{' '}
              <Link href="/guru" className="font-semibold text-aura-primary hover:underline">
                halaman kelas
              </Link>
              .
            </p>
          )}
          {galatAwal && (
            <p role="alert" className="font-body text-[12px] leading-[18px] font-medium text-aura-red">
              {galatAwal}
            </p>
          )}
          {materiId && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-aura-primary/15 bg-aura-primary/5 px-4 py-3">
              <p className="font-body text-[13px] leading-[20px] font-medium text-aura-ink">
                Kamu sedang mengedit materi tersimpan.
              </p>
              <button
                type="button"
                onClick={mulaiBaru}
                className="font-display text-[12px] font-semibold text-aura-primary hover:underline"
              >
                Buat materi baru
              </button>
            </div>
          )}
        </div>
      </section>

      {!materiId && <section className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-14 -top-16 size-40 rounded-full bg-aura-violet/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="aura-eyebrow self-start">
              <FileText aria-hidden="true" className="size-3.5" />
              Sumber modul
            </span>
            <h2 className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
              Pilih cara memasukkan modul
            </h2>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Tempel teks modul langsung atau unggah berkas PDF. Teks/PDF sumber tidak disimpan; hasil empat
              bentuk bisa disimpan ke materi kelas.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Sumber modul"
            className="grid grid-cols-2 gap-1 rounded-full border border-white/60 bg-white/45 p-1 backdrop-blur-sm sm:max-w-sm"
          >
            {(
              [
                ["teks", "Tempel teks", FileText],
                ["pdf", "Unggah PDF", FileUp],
              ] as const
            ).map(([nilai, label, Ikon]) => {
              const terpilih = sumber === nilai;
              return (
                <button
                  key={nilai}
                  type="button"
                  role="tab"
                  aria-selected={terpilih}
                  onClick={() => setSumber(nilai)}
                  className={`flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-1.5 font-display text-[12px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-[13px] ${
                    terpilih
                      ? "bg-gradient-to-r from-aura-primary to-aura-primary-deep text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]"
                      : "text-aura-muted hover:bg-white/70 hover:text-aura-ink"
                  }`}
                >
                  <Ikon aria-hidden="true" className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>

          {sumber === "teks" ? (
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${idDasar}-teks`}
                className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
              >
                Teks modul
              </label>
              <textarea
                id={`${idDasar}-teks`}
                rows={12}
                aria-describedby={`${idDasar}-bantuan ${idDasar}-hitung`}
                className={`${KELAS_ISIAN} min-h-[240px] resize-y`}
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
              />
              <div className="flex flex-wrap items-start justify-between gap-2 font-body text-[12px] leading-[18px] font-medium">
                <p id={`${idDasar}-bantuan`} className="flex items-start gap-1.5 text-aura-muted">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-aura-primary" />
                  Jangan tempelkan nama siswa atau data pribadi. Panjang teks {PANJANG_MODUL_MIN}–{PANJANG_MODUL_MAKS}{" "}
                  karakter.
                </p>
                <p
                  id={`${idDasar}-hitung`}
                  aria-live="polite"
                  className={`tabular-nums ${panjangSesuai || panjang === 0 ? "text-aura-muted" : "text-aura-red"}`}
                >
                  {panjang} / {PANJANG_MODUL_MAKS} karakter
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                File modul (PDF)
              </p>
              <input
                id={`${idDasar}-pdf`}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => pilihBerkas(e.target.files?.[0] ?? null)}
                className="peer sr-only"
              />
              <label
                htmlFor={`${idDasar}-pdf`}
                className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-aura-primary/25 bg-white/45 px-4 py-6 text-center transition-colors hover:border-aura-primary/40 hover:bg-white/70 peer-focus-visible:ring-[3px] peer-focus-visible:ring-aura-primary/40"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary/10 to-aura-violet/15 text-aura-primary ring-1 ring-white/70">
                  <FileUp aria-hidden="true" className="size-5" />
                </span>
                <span className="font-display text-[14px] leading-[22px] font-semibold text-aura-ink">
                  {berkas ? berkas.name : "Pilih berkas PDF"}
                </span>
                <span className="font-body text-[12px] leading-[18px] text-aura-muted">
                  {berkas ? `${ukuranBerkas(berkas.size)} · siap diubah` : "Hanya PDF, maksimal 5 MB"}
                </span>
              </label>
              <p className="text-[12px] leading-[18px] font-medium text-aura-muted">
                Jangan unggah file yang berisi nama siswa atau data pribadi.
              </p>
              {galatBerkas && (
                <p role="alert" className="text-[12px] leading-[18px] font-medium text-[#93000a]">
                  {galatBerkas}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-1.5 font-body text-[12px] leading-[18px] font-medium text-aura-muted">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-aura-primary" />
              Hasil akan disimpan setelah kamu menekan Simpan di pratinjau.
            </p>
            <button
              type="button"
              disabled={!siapKirim || memuat}
              onClick={() => void ubah()}
              className="aura-btn aura-btn-primary h-[52px] w-full shrink-0 px-6 text-[15px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none sm:w-auto"
            >
              {memuat ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="size-4" />
              )}
              Ubah jadi 4 bentuk belajar
            </button>
          </div>
        </div>
      </section>}

      {keadaan.status === "memuat" && (
        <section role="status" aria-live="polite" className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/70">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
                Menyusun materi dari modul
              </h2>
              <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                Empat bentuk belajar sedang disiapkan. Halaman ini akan diperbarui sendiri.
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="mt-4 flex flex-col gap-2">
            <span className="h-3 w-2/3 animate-pulse rounded-full bg-aura-primary/10" />
            <span className="h-3 w-full animate-pulse rounded-full bg-aura-primary/10" />
            <span className="h-3 w-5/6 animate-pulse rounded-full bg-aura-primary/10" />
          </div>
        </section>
      )}

      {keadaan.status === "gagal" && (
        <section
          role="alert"
          className="aura-glass relative overflow-hidden rounded-[24px] border-l-4 border-l-aura-red p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-aura-red/10 text-aura-red ring-1 ring-white/70">
                <AlertTriangle aria-hidden="true" className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
                  Materi belum berhasil dibuat
                </h2>
                <p className="font-body text-[13px] leading-[20px] text-aura-muted">{keadaan.pesan}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void ubah()}
              className="aura-btn aura-btn-secondary h-12 w-full shrink-0 px-5 text-[13px] sm:w-auto"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Coba lagi
            </button>
          </div>
        </section>
      )}

      {keadaan.status === "siap" && (
        <section aria-labelledby={`${idDasar}-pratinjau`} className="flex flex-col gap-4">
          <div className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-16 size-40 rounded-full bg-aura-emerald/10 blur-3xl"
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex max-w-xl flex-col gap-1">
                <span className="aura-eyebrow self-start">
                  <CircleCheck aria-hidden="true" className="size-3.5" />
                  Pratinjau
                </span>
                <h2
                  id={`${idDasar}-pratinjau`}
                  className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink"
                >
                  Empat bentuk belajar siap diperiksa
                </h2>
                <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                  Periksa hasilnya, lalu simpan ke materi kelas agar mudah dibuka lagi.
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:shrink-0">
                <button
                  type="button"
                  disabled={mengunduh === "pptx"}
                  onClick={() => void unduh("pptx", keadaan.isi)}
                  className="aura-btn aura-btn-secondary h-12 px-4 text-[13px] disabled:opacity-60"
                >
                  {mengunduh === "pptx" ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Presentation aria-hidden="true" className="size-4" />
                  )}
                  Unduh PPT
                </button>
                <button
                  type="button"
                  disabled={mengunduh === "docx"}
                  onClick={() => void unduh("docx", keadaan.isi)}
                  className="aura-btn aura-btn-secondary h-12 px-4 text-[13px] disabled:opacity-60"
                >
                  {mengunduh === "docx" ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <FileText aria-hidden="true" className="size-4" />
                  )}
                  Unduh dokumen (Word)
                </button>
                <button
                  type="button"
                  disabled={!bisaSimpan || menyimpan}
                  onClick={() => void simpan()}
                  className="aura-btn aura-btn-primary h-12 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {menyimpan ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Save aria-hidden="true" className="size-4" />
                  )}
                  {materiId ? "Simpan perubahan" : "Simpan ke materi kelas"}
                </button>
              </div>
            </div>

            {!bisaSimpan && !tersimpan && (
              <p className="relative mt-3 font-body text-[12px] leading-[18px] font-medium text-aura-muted">
                Lengkapi kelas dan bab/topik di bagian Tujuan materi untuk menyimpan hasil ini.
              </p>
            )}
            {galatSimpan && (
              <p role="alert" className="relative mt-3 font-body text-[12px] leading-[18px] font-medium text-aura-red">
                {galatSimpan}
              </p>
            )}
            {tersimpan && (
              <div
                role="status"
                className="relative mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-aura-emerald/20 bg-aura-emerald/10 px-4 py-3"
              >
                <CircleCheck aria-hidden="true" className="size-4 text-aura-emerald" />
                <p className="font-body text-[12px] leading-[18px] font-medium text-aura-ink">
                  Materi tersimpan di {kelasTerpilih ? `${kelasTerpilih.mapel} — ${kelasTerpilih.nama}` : "kelas"}.
                </p>
                <Link
                  href={`/guru/kelas/materi?kelas=${kelasId}`}
                  className="font-display text-[12px] font-semibold text-aura-primary hover:underline"
                >
                  Buka materi kelas
                </Link>
              </div>
            )}

            <div className="relative mt-4 flex flex-wrap gap-2">
              {BENTUK.map(({ label, ikon: Ikon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted ring-1 ring-inset ring-white/70"
                >
                  <Ikon aria-hidden="true" className="size-3.5 text-aura-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <TabMateriSiswa key={keadaan.nomor} isi={keadaan.isi} formatAwal={null} />
        </section>
      )}
    </div>
  );
}
