"use client";

import { Suspense, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  CircleCheck,
  Coins,
  FileText,
  FileUp,
  Headphones,
  Loader2,
  PlayCircle,
  Plus,
  Presentation,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { ModalGayaPpt } from "@/components/ModalGayaPpt";
import { PemilihModel } from "@/components/PemilihModel";
import { RiwayatKoin } from "@/components/RiwayatKoin";
import { TabMateriSiswa } from "@/components/TabMateriSiswa";
import {
  ambilDaftarKelas,
  ambilKoin,
  ambilMateriPustaka,
  ambilModelAi,
  ambilRiwayatKoin,
  simpanMateriPustaka,
  ubahMateriPustaka,
  ubahModul,
  ubahModulPdf,
} from "@/lib/api-klien";
import { KOIN_PER_MODUL, PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN, UKURAN_PDF_MAKS_BYTE } from "@/lib/konstanta";
import { tautanTopUpKoin } from "@/lib/koin";
import { formatKonteks } from "@/lib/pemilih-model";
import { unduhDocx, unduhPptx } from "@/lib/unduh-materi";
import type {
  FokusModul,
  FormatMateri,
  GayaPpt,
  IsiMateri,
  KelasRingkas,
  ModelAi,
  SumberMateri,
  TransaksiKoin,
} from "@/lib/tipe";

type Keadaan =
  | { status: "diam" }
  | { status: "memuat" }
  | { status: "gagal"; pesan: string }
  | { status: "siap"; isi: IsiMateri; nomor: number };

type Sumber = "teks" | "pdf";

const BENTUK: { format: FormatMateri; label: string; ikon: LucideIcon; deskripsi: string }[] = [
  { format: "video", label: "Video", ikon: PlayCircle, deskripsi: "Naskah video dengan alur visual yang runtut." },
  { format: "audio", label: "Audio", ikon: Headphones, deskripsi: "Narasi audio yang enak didengar saat belajar." },
  { format: "bacaan", label: "Bacaan", ikon: FileText, deskripsi: "Teks bacaan terstruktur dengan poin penting." },
  { format: "ppt", label: "PPT", ikon: Presentation, deskripsi: "Slide ringkas siap dipakai untuk presentasi." },
];

const KELAS_ISIAN =
  "w-full rounded-2xl border border-white/70 bg-white/65 px-3.5 py-3 font-body text-base leading-relaxed text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85";

const CONTOH_MODUL = `CAPAIAN PEMBELAJARAN (FASE D - KELAS VII):
Peserta didik dapat memahami konsep variabel, konstanta, dan koefisien dalam kalimat terbuka matematika, serta menyelesaikan persamaan linear satu variabel (PLSV) untuk memecahkan masalah kontekstual dalam kehidupan sehari-hari.

TUJUAN PEMBELAJARAN HARIAN:
1. Siswa mampu membedakan kalimat terbuka dan kalimat tertutup dengan analogi timbangan neraca seimbang.
2. Siswa mampu menyusun model matematika sederhana dari cerita belanja Bu Ani.
3. Siswa dapat menemukan nilai variabel dengan operasi hitung setara kedua ruas.`;

const FOKUS_PILIHAN: { nilai: FokusModul; label: string; deskripsi: string }[] = [
  { nilai: "sederhanakan", label: "Sederhanakan Bahasa", deskripsi: "Untuk siswa yang perlu remedial." },
  { nilai: "metafora", label: "Metafora/Neraca Visual", deskripsi: "Analogi visual yang mudah dibayangkan." },
  { nilai: "podcast", label: "Audio Gaya Podcast", deskripsi: "Narasi audio yang santai untuk remaja." },
  { nilai: "hots", label: "Soal Tantangan (HOTS)", deskripsi: "Tambahan soal pengayaan dan pembahasan." },
];

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
  const [model, setModel] = useState("");
  const [fokus, setFokus] = useState<FokusModul[]>([]);
  const [formatPilihan, setFormatPilihan] = useState<FormatMateri | "">("");
  const [gayaPpt, setGayaPpt] = useState<GayaPpt>("editorial");
  const [gayaSementara, setGayaSementara] = useState<GayaPpt>("editorial");
  const [modalGaya, setModalGaya] = useState(false);
  const [daftarModel, setDaftarModel] = useState<ModelAi[]>([]);
  const [memuatModel, setMemuatModel] = useState(true);
  const [galatModel, setGalatModel] = useState<string | null>(null);
  const [percobaanModel, setPercobaanModel] = useState(0);
  const [koin, setKoin] = useState<number | null>(null);
  const [biayaKoin, setBiayaKoin] = useState(KOIN_PER_MODUL);
  const [whatsappAdmin, setWhatsappAdmin] = useState<string | null>(null);
  const [memuatKoin, setMemuatKoin] = useState(true);
  const [galatKoin, setGalatKoin] = useState<string | null>(null);
  const [riwayat, setRiwayat] = useState<TransaksiKoin[]>([]);
  const [memuatRiwayat, setMemuatRiwayat] = useState(true);
  const [galatRiwayat, setGalatRiwayat] = useState<string | null>(null);
  const [percobaanRiwayat, setPercobaanRiwayat] = useState(0);
  const kelasAwalParam = params.get("kelas");
  const materiAwalParam = params.get("materi");

  // Dihitung setelah spasi di awal dan akhir dibuang, sama dengan skema di server.
  const panjang = teks.trim().length;
  const panjangSesuai = panjang >= PANJANG_MODUL_MIN && panjang <= PANJANG_MODUL_MAKS;
  const memuat = keadaan.status === "memuat";
  const koinCukup = koin !== null && koin >= biayaKoin;
  const labelFormat = BENTUK.find((bentuk) => bentuk.format === formatPilihan)?.label ?? "";
  const siapKirim =
    (sumber === "teks" ? panjangSesuai : berkas !== null) &&
    model !== "" &&
    formatPilihan !== "" &&
    koinCukup;
  const kelasTerpilih = daftarKelas.find((k) => k.id === kelasId);
  const bisaSimpan = kelasId !== "" && bab.trim().length > 0 && keadaan.status === "siap";
  const topUpHref = tautanTopUpKoin(whatsappAdmin, koin);
  const rekomendasiModel = ["Anthropic", "OpenAI", "Google", "DeepSeek"]
    .map((grup) => daftarModel.find((m) => m.grup === grup))
    .filter((m): m is ModelAi => Boolean(m));

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

  useEffect(() => {
    let aktif = true;
    ambilModelAi()
      .then(({ modelDefault, daftar }) => {
        if (!aktif) return;
        setDaftarModel(daftar);
        setModel(modelDefault);
      })
      .catch((err: unknown) => {
        if (!aktif) return;
        setGalatModel(err instanceof Error ? err.message : "Daftar model AI belum bisa dimuat.");
      })
      .finally(() => {
        if (aktif) setMemuatModel(false);
      });
    return () => {
      aktif = false;
    };
  }, [percobaanModel]);

  function ulangiModel() {
    setMemuatModel(true);
    setGalatModel(null);
    setPercobaanModel((n) => n + 1);
  }

  const muatKoin = useCallback(async () => {
    try {
      const data = await ambilKoin();
      setKoin(data.koin);
      setBiayaKoin(data.biayaModul);
      setWhatsappAdmin(data.whatsappAdmin);
      setGalatKoin(null);
    } catch (err) {
      setGalatKoin(err instanceof Error ? err.message : "Saldo koin belum bisa dimuat.");
    } finally {
      setMemuatKoin(false);
    }
  }, []);

  useEffect(() => {
    let aktif = true;
    ambilKoin()
      .then((data) => {
        if (!aktif) return;
        setKoin(data.koin);
        setBiayaKoin(data.biayaModul);
        setWhatsappAdmin(data.whatsappAdmin);
        setGalatKoin(null);
      })
      .catch((err: unknown) => {
        if (!aktif) return;
        setGalatKoin(err instanceof Error ? err.message : "Saldo koin belum bisa dimuat.");
      })
      .finally(() => {
        if (aktif) setMemuatKoin(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const muatRiwayat = useCallback(async () => {
    try {
      const data = await ambilRiwayatKoin();
      setRiwayat(data.transaksi);
      setGalatRiwayat(null);
    } catch (err) {
      setGalatRiwayat(err instanceof Error ? err.message : "Riwayat koin belum bisa dimuat.");
    } finally {
      setMemuatRiwayat(false);
    }
  }, []);

  useEffect(() => {
    let aktif = true;
    ambilRiwayatKoin()
      .then((data) => {
        if (!aktif) return;
        setRiwayat(data.transaksi);
        setGalatRiwayat(null);
      })
      .catch((err: unknown) => {
        if (!aktif) return;
        setGalatRiwayat(err instanceof Error ? err.message : "Riwayat koin belum bisa dimuat.");
      })
      .finally(() => {
        if (aktif) setMemuatRiwayat(false);
      });
    return () => {
      aktif = false;
    };
  }, [percobaanRiwayat]);

  function ulangiRiwayat() {
    setMemuatRiwayat(true);
    setGalatRiwayat(null);
    setPercobaanRiwayat((n) => n + 1);
  }

  function gunakanContoh() {
    setSumber("teks");
    setTeks(CONTOH_MODUL);
    setTersimpan(false);
    setGalatSimpan(null);
  }

  function pilihFormat(nilai: FormatMateri) {
    if (memuat) return;
    setFormatPilihan(nilai);
    if (keadaan.status === "siap") {
      setKeadaan({ status: "diam" });
      setTersimpan(false);
      setGalatSimpan(null);
    }
  }

  function toggleFokus(nilai: FokusModul) {
    setFokus((sebelumnya) =>
      sebelumnya.includes(nilai) ? sebelumnya.filter((item) => item !== nilai) : [...sebelumnya, nilai],
    );
  }

  function rapikanTeks() {
    const rapi = teks
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]+([,.;:!?])/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .map((baris) => baris.trim())
      .join("\n")
      .trim();
    setTeks(rapi);
    setTersimpan(false);
    setGalatSimpan(null);
  }

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

  async function ubah(gayaPptPilihan?: GayaPpt) {
    if (!siapKirim) return;
    const gaya = formatPilihan === "ppt" ? (gayaPptPilihan ?? gayaPpt) : undefined;
    setKeadaan({ status: "memuat" });
    setTersimpan(false);
    setGalatSimpan(null);
    try {
      const hasil =
        sumber === "teks"
          ? await ubahModul(teks, model, fokus, formatPilihan || undefined, gaya)
          : await ubahModulPdf(await bacaSebagaiBase64(berkas!), model, fokus, formatPilihan || undefined, gaya);
      const { isi, sumber: sumberHasil, koin: sisaKoin } = hasil;
      if (typeof sisaKoin === "number") setKoin(sisaKoin);
      else void muatKoin();
      void muatRiwayat();
      setSumberMateri(sumberHasil);
      setAsalMateri(sumber);
      // Nomor baru memasang ulang pratinjau agar tab dan jawaban latihan kembali ke awal.
      const berikut = nomor + 1;
      setNomor(berikut);
      setKeadaan({ status: "siap", isi, nomor: berikut });
    } catch (err) {
      void muatKoin();
      void muatRiwayat();
      setKeadaan({ status: "gagal", pesan: err instanceof Error ? err.message : "Materi belum berhasil dibuat." });
    }
  }

  function tanganiGenerate() {
    if (memuat) return;
    if (formatPilihan === "ppt") {
      setGayaSementara(gayaPpt);
      setModalGaya(true);
      return;
    }
    void ubah();
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

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-body text-[12px] leading-[18px] text-aura-muted">
        <Link href="/guru" className="transition-colors hover:text-aura-primary">
          Beranda
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span className="font-semibold text-aura-ink">Ubah Modul</span>
      </nav>

      <section className="aura-glass relative overflow-hidden rounded-[28px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-br from-aura-primary/[0.07] via-transparent to-aura-violet/10"
        />
        <header className="relative p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <span className="aura-eyebrow self-start">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Ruang kerja AI
              </span>
              <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink sm:text-[32px] sm:leading-[40px]">
                Ubah modul ajar jadi satu format belajar
              </h1>
              <p className="font-body text-[14px] leading-[22px] text-aura-muted">
                Tempelkan teks atau unggah PDF modul, pilih satu format hasil, lalu simpan ke materi kelas.
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-body text-[12px] leading-[18px] text-aura-muted">
                <span>1 format per generate</span>
                <span aria-hidden="true" className="size-1 rounded-full bg-aura-muted/40" />
                <span>
                  {PANJANG_MODUL_MIN}–{PANJANG_MODUL_MAKS} karakter
                </span>
                <span aria-hidden="true" className="size-1 rounded-full bg-aura-muted/40" />
                <span>PDF maks 5 MB</span>
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-[252px]">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.06em] text-aura-muted">
                Pilih format hasil
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BENTUK.map(({ format, label, ikon: Ikon, deskripsi }) => {
                  const dipilih = formatPilihan === format;
                  return (
                    <button
                      key={format}
                      type="button"
                      aria-pressed={dipilih}
                      title={deskripsi}
                      disabled={memuat}
                      onClick={() => pilihFormat(format)}
                      className={`flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-[20px] border px-3 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        dipilih
                          ? "border-aura-primary/40 bg-aura-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                          : "border-aura-primary/10 bg-white/50 hover:bg-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Ikon
                          aria-hidden="true"
                          className={`size-4 ${dipilih ? "text-aura-primary" : "text-aura-primary/80"}`}
                        />
                        {dipilih && <CircleCheck aria-hidden="true" className="size-3.5 text-aura-primary" />}
                      </span>
                      <span
                        className={`font-display text-[11px] font-bold uppercase tracking-[0.04em] ${
                          dipilih ? "text-aura-primary" : "text-aura-ink"
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>
      </section>

      <section className="aura-glass rounded-[24px] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <aside className="flex flex-col gap-4 rounded-[20px] bg-gradient-to-br from-[#FFF7DD] via-[#FFEFC2] to-[#FFE3A3] p-4 text-[#6B4A00] ring-1 ring-inset ring-white/70 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[#B45309] shadow-sm ring-1 ring-inset ring-white/80">
                <Coins aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A5A00]">
                  Koin kamu
                </p>
                <p className="font-display text-[32px] leading-[36px] font-extrabold tracking-[-0.04em] tabular-nums">
                  {memuatKoin ? "…" : (koin ?? "—")}
                </p>
              </div>
            </div>

            <p className="font-body text-[12px] leading-[18px] text-[#7A5200] sm:border-l sm:border-[#C99A2E]/30 sm:pl-4">
              Biaya generate <strong className="font-display font-bold">{biayaKoin} koin</strong> per materi
            </p>

            <div className="flex flex-col gap-2 sm:items-end">
              {topUpHref ? (
                <a
                  href={topUpHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-white/80 px-3 font-display text-[11px] font-bold text-[#8A5A00] ring-1 ring-inset ring-white/80 transition-colors hover:bg-white"
                >
                  <Plus aria-hidden="true" className="size-3.5" />
                  Tambah koin
                </a>
              ) : (
                <span
                  className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-white/50 px-3 font-display text-[11px] font-bold text-[#8A5A00]/70 ring-1 ring-inset ring-white/60"
                  title="Nomor admin belum diatur."
                >
                  <Plus aria-hidden="true" className="size-3.5" />
                  Tambah koin
                </span>
              )}
              {galatKoin && (
                <p role="alert" className="font-body text-[11px] leading-[16px] font-medium text-[#8A2E00]">
                  {galatKoin}
                </p>
              )}
              {!memuatKoin && koin !== null && !koinCukup && (
                <p role="status" className="font-body text-[11px] leading-[16px] font-semibold text-[#8A2E00]">
                  Koin tidak cukup untuk generate berikutnya.
                </p>
              )}
            </div>
          </aside>

          <RiwayatKoin
            tertanam
            transaksi={riwayat}
            memuat={memuatRiwayat}
            galat={galatRiwayat}
            onCobaLagi={ulangiRiwayat}
          />
        </div>
      </section>

      <section className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-14 -top-16 size-40 rounded-full bg-aura-violet/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-aura-primary/10 font-display text-[13px] font-bold text-aura-primary ring-1 ring-aura-primary/15">
              1
            </span>
            <div className="flex flex-col gap-1">
              <span className="aura-eyebrow self-start">
                <BookOpen aria-hidden="true" className="size-3.5" />
                Sempurnakan materi
              </span>
              <h2 className="mt-1 font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
                Sempurnakan Kalimat & Topik Materi
              </h2>
              <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                Lengkapi konteks kelas dan topik agar hasil format yang dipilih lebih tepat sasaran.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                Mata pelajaran
              </span>
              <div className={`${KELAS_ISIAN} flex min-h-12 items-center gap-2 text-aura-muted`}>
                <BookOpen aria-hidden="true" className="size-4 shrink-0 text-aura-primary" />
                <span className="truncate">{kelasTerpilih?.mapel ?? "Pilih kelas dulu"}</span>
              </div>
            </div>

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-aura-primary/10 font-display text-[13px] font-bold text-aura-primary ring-1 ring-aura-primary/15">
                2
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-[24px] leading-[32px] font-bold tracking-[-0.02em] text-aura-ink">
                  Pilih Cara Memasukkan Modul Ajar
                </h2>
                <p className="font-body text-[13px] leading-[20px] text-aura-muted">
                  Mendukung teks materi, RPP, modul, atau dokumen PDF modul sekolah.
                </p>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Sumber modul"
              className="flex flex-wrap gap-1 rounded-2xl border border-white/70 bg-white/55 p-1 backdrop-blur-sm"
            >
              {(
                [
                  ["teks", "Tempel Teks", FileText],
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
                    className={`inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 font-display text-[12px] font-semibold transition-colors ${
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
          </div>

          {sumber === "teks" ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor={`${idDasar}-teks`}
                  className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
                >
                  Isi Teks Modul / Materi Dasar
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={gunakanContoh}
                    className="font-display text-[10px] font-semibold text-aura-primary hover:underline"
                  >
                    Gunakan contoh
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-full bg-aura-emerald/10 px-2.5 py-1 font-display text-[9px] font-bold text-[#047857]">
                    <ShieldCheck aria-hidden="true" className="size-3" />
                    Data pribadi tidak disimpan
                  </span>
                  <span
                    id={`${idDasar}-hitung`}
                    aria-live="polite"
                    className={`font-display text-[10px] font-semibold tabular-nums ${
                      panjangSesuai || panjang === 0 ? "text-aura-muted" : "text-aura-red"
                    }`}
                  >
                    {panjang} / {PANJANG_MODUL_MAKS} karakter
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id={`${idDasar}-teks`}
                  rows={14}
                  aria-describedby={`${idDasar}-bantuan ${idDasar}-hitung`}
                  className={`${KELAS_ISIAN} min-h-[320px] resize-y pb-14`}
                  placeholder={`Tempel materi di sini...\n\nCAPAIAN PEMBELAJARAN:\nTUJUAN PEMBELAJARAN:\nMATERI / LANGKAH KEGIATAN:`}
                  value={teks}
                  onChange={(e) => setTeks(e.target.value)}
                />
                <button
                  type="button"
                  onClick={rapikanTeks}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl border border-aura-primary/15 bg-white/90 px-3 py-2 font-display text-[10px] font-semibold text-aura-primary shadow-sm transition-colors hover:bg-white"
                >
                  <Wand2 aria-hidden="true" className="size-3.5" />
                  Rapikan teks
                </button>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-2 font-body text-[11px] leading-[17px] font-medium">
                <p id={`${idDasar}-bantuan`} className="flex items-start gap-1.5 text-aura-muted">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-aura-primary" />
                  Jangan tempelkan nama siswa atau data pribadi. Panjang teks {PANJANG_MODUL_MIN}–{PANJANG_MODUL_MAKS}{" "}
                  karakter.
                </p>
                <p className="text-aura-muted">PDF maksimal 5 MB jika menggunakan unggah file.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                Unggah File Modul (PDF)
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

          <div className="rounded-2xl border border-aura-primary/15 bg-white/55 p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                    <Sparkles aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <p className="font-display text-[16px] leading-snug font-bold text-aura-ink">
                      Mesin Proses AI & Pedagogi
                    </p>
                    <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
                      Pilih model dan fokus untuk format yang dipilih. Biaya {biayaKoin} koin per generate.
                    </p>
                  </div>
                </div>

                {rekomendasiModel.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.06em] text-aura-muted">
                      Rekomendasi
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {rekomendasiModel.map((m) => {
                        const aktif = model === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setModel(m.id)}
                            className={`rounded-2xl border p-3 text-left transition-colors ${
                              aktif
                                ? "border-aura-primary/35 bg-aura-primary/[0.08] ring-1 ring-aura-primary/20"
                                : "border-white/70 bg-white/55 hover:bg-white/80"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate font-display text-[9px] font-bold uppercase tracking-[0.08em] text-aura-muted">
                                {m.grup}
                              </span>
                              {aktif && <CircleCheck aria-hidden="true" className="size-3.5 shrink-0 text-aura-primary" />}
                            </span>
                            <span className="mt-1 block truncate font-display text-[12px] leading-[18px] font-semibold text-aura-ink">
                              {m.name}
                            </span>
                            <span className="mt-0.5 block font-body text-[10px] leading-[14px] text-aura-muted">
                              {formatKonteks(m.contextLength) ?? "—"} konteks
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex min-w-0 flex-col gap-1.5">
                  <span
                    id={`${idDasar}-model-label`}
                    className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
                  >
                    Model
                  </span>
                  <PemilihModel
                    id={`${idDasar}-model`}
                    labelId={`${idDasar}-model-label`}
                    nilai={model}
                    daftar={daftarModel}
                    memuat={memuatModel}
                    nonaktif={Boolean(galatModel) && daftarModel.length === 0}
                    onPilih={setModel}
                  />
                </div>

                {galatModel ? (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-aura-red/15 bg-aura-red/5 px-3 py-2 font-body text-[12px] leading-[18px] font-medium text-aura-red"
                  >
                    <span>{galatModel}</span>
                    <button type="button" onClick={ulangiModel} className="font-semibold underline underline-offset-2">
                      Coba lagi
                    </button>
                  </div>
                ) : !memuatModel && daftarModel.length === 0 ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-aura-amber/20 bg-aura-amber/5 px-3 py-2 font-body text-[12px] leading-[18px] font-medium text-[#92400e]">
                    <span>Model belum berhasil dimuat.</span>
                    <button type="button" onClick={ulangiModel} className="font-semibold underline underline-offset-2">
                      Muat ulang
                    </button>
                  </div>
                ) : (
                  <p className="font-body text-[12px] leading-[18px] text-aura-muted">
                    Model murah seperti DeepSeek Flash biasanya cukup untuk materi pelajaran.
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.06em] text-aura-muted">
                    Fokus Dimensi Pembelajaran (Opsional)
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FOKUS_PILIHAN.map(({ nilai, label, deskripsi }) => {
                      const aktif = fokus.includes(nilai);
                      return (
                        <label
                          key={nilai}
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 transition-colors ${
                            aktif
                              ? "border-aura-primary/30 bg-aura-primary/[0.06]"
                              : "border-white/70 bg-white/50 hover:bg-white/70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={aktif}
                            onChange={() => toggleFokus(nilai)}
                            className="mt-0.5 size-4 shrink-0 accent-[#2563EB]"
                          />
                          <span className="min-w-0">
                            <span className="block font-display text-[11px] leading-[16px] font-semibold text-aura-ink">
                              {label}
                            </span>
                            <span className="mt-0.5 block font-body text-[10px] leading-[14px] text-aura-muted">
                              {deskripsi}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <p className="font-body text-[10px] leading-[15px] text-aura-muted">
                  Model dan fokus mengikuti pendekatan pembelajaran di kelas.
                </p>
              </div>

              <div className="flex flex-col gap-2 lg:w-[240px] lg:shrink-0">
                <button
                  type="button"
                  disabled={!siapKirim || memuat}
                  onClick={tanganiGenerate}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aura-primary to-aura-primary-deep px-5 font-display text-[14px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.7)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100"
                >
                  {memuat ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-4" />
                  )}
                  {memuat
                    ? "Menyusun materi…"
                    : memuatKoin
                      ? "Memuat saldo…"
                      : galatKoin
                        ? "Koin belum aktif"
                        : !koinCukup
                          ? "Koin habis"
                          : !formatPilihan
                            ? "Pilih format"
                            : !model
                              ? "Pilih model"
                              : `Ubah jadi ${labelFormat}`}
                </button>
                <p className="flex items-start gap-1.5 font-body text-[11px] leading-[16px] text-aura-muted">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-aura-primary" />
                  Hasil disimpan setelah kamu menekan Simpan di pratinjau.
                </p>
              </div>
            </div>
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
                Format yang dipilih sedang disiapkan. Halaman ini akan diperbarui sendiri.
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
                  Format yang dipilih siap diperiksa
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
                Lengkapi kelas dan bab/topik di bagian Sempurnakan materi untuk menyimpan hasil ini.
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

          </div>

          <TabMateriSiswa
            key={keadaan.nomor}
            isi={keadaan.isi}
            formatAwal={null}
            hanyaFormat={keadaan.isi.format_utama ?? (formatPilihan || null)}
          />
        </section>
      )}

      <ModalGayaPpt
        terbuka={modalGaya}
        nilai={gayaSementara}
        memuat={memuat}
        onPilih={setGayaSementara}
        onTutup={() => setModalGaya(false)}
        onBuat={() => {
          setGayaPpt(gayaSementara);
          setModalGaya(false);
          void ubah(gayaSementara);
        }}
      />
    </div>
  );
}
