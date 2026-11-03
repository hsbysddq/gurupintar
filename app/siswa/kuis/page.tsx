"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Send, type LucideIcon } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { KartuSoalKuis } from "@/components/KartuSoalKuis";
import { KerangkaSiswa } from "@/components/KerangkaSiswa";
import { NavigasiSoal } from "@/components/NavigasiSoal";
import { ProgressKuis } from "@/components/ProgressKuis";
import { StatusHalaman } from "@/components/StatusHalaman";
import { useSesiAktif } from "@/hooks/use-sesi-aktif";
import { ambilSoal, ErrorApi, kirimJawaban, kirimPelanggaran } from "@/lib/api-klien";
import { hapusSesi } from "@/lib/sesi-lokal";
import type { KodePilihan, SoalUntukSiswa } from "@/lib/tipe";

type Muatan =
  | { status: "memuat" }
  | { status: "gagal"; pesan: string; sesiHilang: boolean }
  | { status: "siap"; soal: SoalUntukSiswa[] };

type Kiriman = { status: "diam" } | { status: "mengirim" } | { status: "gagal"; pesan: string; ditutup: boolean };

const PESAN_GAGAL_KIRIM = "Jawaban belum terkirim. Periksa koneksi, lalu coba lagi.";

export default function HalamanKuis() {
  const router = useRouter();
  const sesi = useSesiAktif();
  const sesiId = sesi?.sesiId;

  const [percobaan, setPercobaan] = useState(0);
  const [muatan, setMuatan] = useState<Muatan>({ status: "memuat" });
  const [indeks, setIndeks] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, KodePilihan>>({});
  const [kiriman, setKiriman] = useState<Kiriman>({ status: "diam" });
  const selesaiRef = useRef(false);

  // Catat ketika siswa meninggalkan tab/jendela kuis. Ini heuristik, bukan bukti mutlak.
  useEffect(() => {
    if (!sesiId) return;
    selesaiRef.current = false;
    let terakhir = 0;

    const saatVisibilitasBerubah = () => {
      if (document.visibilityState !== "hidden" || selesaiRef.current) return;
      const sekarang = Date.now();
      if (sekarang - terakhir < 1_000) return;
      terakhir = sekarang;
      void kirimPelanggaran(sesiId).catch(() => {
        // Jaringan atau migrasi belum siap tidak boleh mengganggu pengerjaan kuis.
      });
    };

    document.addEventListener("visibilitychange", saatVisibilitasBerubah);
    return () => document.removeEventListener("visibilitychange", saatVisibilitasBerubah);
  }, [sesiId]);

  // Belum memilih kuis → kembali ke halaman kode.
  useEffect(() => {
    if (sesi === null) router.replace("/siswa/gabung");
  }, [sesi, router]);

  useEffect(() => {
    if (!sesiId) return;
    let batal = false;
    ambilSoal(sesiId)
      .then((soal) => {
        if (!batal) setMuatan({ status: "siap", soal });
      })
      .catch((err: unknown) => {
        if (batal) return;
        const status = err instanceof ErrorApi ? err.status : 0;
        setMuatan({
          status: "gagal",
          pesan: status === 404 ? "Kuis tidak ditemukan. Masukkan kode kelas lagi." : "Soal belum berhasil dimuat. Periksa koneksi, lalu coba lagi.",
          sesiHilang: status === 404,
        });
      });
    return () => {
      batal = true;
    };
  }, [sesiId, percobaan]);

  if (!sesi || muatan.status === "memuat") {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat soal" />
      </KerangkaSiswa>
    );
  }

  if (muatan.status === "gagal") {
    const aksi = muatan.sesiHilang
      ? {
          label: "Masukkan kode lagi",
          onClick: () => {
            hapusSesi();
            router.replace("/siswa/gabung");
          },
        }
      : {
          label: "Coba lagi",
          onClick: () => {
            setMuatan({ status: "memuat" });
            setPercobaan((n) => n + 1);
          },
        };
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="gagal" judul="Soal belum tampil" pesan={muatan.pesan} aksi={aksi} />
      </KerangkaSiswa>
    );
  }

  const { soal } = muatan;
  if (soal.length === 0) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="kosong" judul="Belum ada soal" pesan="Tunggu gurumu menyiapkan kuis." />
      </KerangkaSiswa>
    );
  }

  if (kiriman.status === "gagal" && kiriman.ditutup) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="kosong" judul="Kuis ini sudah ditutup." pesan="Tanyakan kepada gurumu langkah berikutnya." />
      </KerangkaSiswa>
    );
  }

  const soalIni = soal[indeks];
  const terakhir = indeks === soal.length - 1;
  const sudahDijawab = jawaban[soalIni.id] !== undefined;
  const mengirim = kiriman.status === "mengirim";

  async function kirim() {
    if (!sesi) return;
    selesaiRef.current = true;
    setKiriman({ status: "mengirim" });
    try {
      const hasil = await kirimJawaban({
        sesiId: sesi.sesiId,
        jawaban: soal.map((s) => ({ soalId: s.id, pilihan: jawaban[s.id] })),
      });
      try {
        sessionStorage.setItem("gp-hasil-kuis", JSON.stringify({ sesiId: sesi.sesiId, skor: hasil.skor, total: hasil.total }));
      } catch {
        // Penyimpanan tidak tersedia: halaman selesai tampil tanpa skor.
      }
      router.replace("/siswa/selesai");
    } catch (err) {
      selesaiRef.current = false;
      const status = err instanceof ErrorApi ? err.status : 0;
      const pesan = status === 0 || status >= 500 ? PESAN_GAGAL_KIRIM : err instanceof ErrorApi ? err.message : PESAN_GAGAL_KIRIM;
      setKiriman({ status: "gagal", pesan, ditutup: status === 409 });
    }
  }

  function berikutnya() {
    if (terakhir) void kirim();
    else setIndeks((i) => i + 1);
  }

  const labelUtama = terakhir ? (kiriman.status === "gagal" ? "Coba lagi" : "Kirim jawaban") : "Berikutnya";
  const indeksTerjawab = new Set(
    soal.flatMap((s, i) => (jawaban[s.id] !== undefined ? [i] : [])),
  );
  const pilihSoal = (i: number) => setIndeks(i);

  return (
    <KerangkaSiswa
      langkah={3}
      kunciDasbor
      aksi={
        <>
          <div className="hidden lg:block">
            <NavigasiSoal
              total={soal.length}
              indeks={indeks}
              terjawab={indeksTerjawab}
              onPilih={pilihSoal}
              disabled={mengirim}
            />
          </div>
          {kiriman.status === "gagal" && (
            <p role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
              {kiriman.pesan}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <TombolLangkah
              ikon={ArrowLeft}
              disabled={indeks === 0 || mengirim}
              onClick={() => setIndeks((i) => i - 1)}
            >
              Sebelumnya
            </TombolLangkah>
            <TombolLangkah
              utama
              ikon={terakhir ? Send : undefined}
              ikonAkhir={!terakhir ? ArrowRight : undefined}
              disabled={!sudahDijawab}
              memuat={mengirim}
              onClick={berikutnya}
            >
              {labelUtama}
            </TombolLangkah>
          </div>
          <p className="text-center text-[12px] leading-[18px] text-aura-muted">
            Jawaban bisa diubah sebelum dikirim.
          </p>
        </>
      }
    >
      <header className="flex flex-col gap-1.5">
        <span className="aura-eyebrow">Kuis</span>
        <h1 className="font-display text-[24px] leading-[32px] font-extrabold tracking-[-0.02em] text-aura-ink md:text-[28px]">
          Jawab soal berikut
        </h1>
        <p className="text-aura-muted">Pilih satu jawaban yang paling tepat. Kamu bisa kembali sebelum mengirim.</p>
        <p className="text-[12px] leading-[18px] font-medium text-belum-teks">
          Jangan pindah tab atau jendela selama kuis. Aktivitas pindah tab akan dicatat.
        </p>
      </header>
      <ProgressKuis saatIni={indeks + 1} total={soal.length} />
      <KartuSoalKuis
        key={soalIni.id}
        teks={soalIni.teks}
        pilihan={soalIni.pilihan}
        terpilih={jawaban[soalIni.id] ?? null}
        onPilih={(kode) => setJawaban((j) => ({ ...j, [soalIni.id]: kode as KodePilihan }))}
      />
      <KartuKaca className="p-4 lg:hidden">
        <NavigasiSoal
          total={soal.length}
          indeks={indeks}
          terjawab={indeksTerjawab}
          onPilih={pilihSoal}
          disabled={mengirim}
        />
      </KartuKaca>
    </KerangkaSiswa>
  );
}

function TombolLangkah({
  utama = false,
  ikon: Ikon,
  ikonAkhir: IkonAkhir,
  memuat = false,
  disabled = false,
  onClick,
  children,
}: {
  utama?: boolean;
  ikon?: LucideIcon;
  ikonAkhir?: LucideIcon;
  memuat?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled || memuat}
      aria-busy={memuat || undefined}
      onClick={onClick}
      className={`inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 font-display text-[12px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        utama
          ? "bg-gradient-to-r from-aura-primary to-aura-primary-deep text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.65)] hover:brightness-105"
          : "border border-aura-primary/20 bg-white/65 text-aura-primary hover:bg-aura-primary/5"
      }`}
    >
      {memuat ? (
        <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" />
      ) : (
        Ikon && <Ikon aria-hidden="true" className="size-4 shrink-0" />
      )}
      <span className="truncate">{children}</span>
      {!memuat && IkonAkhir && <IkonAkhir aria-hidden="true" className="size-4 shrink-0" />}
    </button>
  );
}
