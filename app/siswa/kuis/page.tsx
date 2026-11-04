"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Send, type LucideIcon } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { KartuSoalKuis } from "@/components/KartuSoalKuis";
import { KerangkaSiswa } from "@/components/KerangkaSiswa";
import { NavigasiSoal } from "@/components/NavigasiSoal";
import {
  cekBlokirDibuka,
  hapusCatatanPelanggaran,
  LayarDiblokir,
  lepasBlokirLokal,
  Lapisan,
  PemantauKuis,
} from "@/components/PemantauKuis";
import { ProgressKuis } from "@/components/ProgressKuis";
import { StatusHalaman } from "@/components/StatusHalaman";
import { useSesiAktif } from "@/hooks/use-sesi-aktif";
import { ambilSoal, ErrorApi, kirimJawaban } from "@/lib/api-klien";
import { formatJadwal } from "@/lib/jadwal-kuis";
import { hapusSesi } from "@/lib/sesi-lokal";
import { sudahTerjawabSoal } from "@/lib/soal-tka";
import type { SoalUntukSiswa } from "@/lib/tipe";

type Muatan =
  | { status: "memuat" }
  | { status: "gagal"; pesan: string; sesiHilang: boolean }
  | { status: "diblokir" }
  | { status: "siap"; soal: SoalUntukSiswa[] };

type Kiriman = { status: "diam" } | { status: "mengirim" } | { status: "gagal"; pesan: string; ditutup: boolean };

const PESAN_GAGAL_KIRIM =
  "Jawaban belum terkirim. Jawabanmu masih tersimpan di halaman ini. Periksa koneksi, lalu coba lagi.";

export default function HalamanKuis() {
  const router = useRouter();
  const sesi = useSesiAktif();
  const sesiId = sesi?.sesiId;

  const [percobaan, setPercobaan] = useState(0);
  const [muatan, setMuatan] = useState<Muatan>({ status: "memuat" });
  const [indeks, setIndeks] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [kiriman, setKiriman] = useState<Kiriman>({ status: "diam" });
  const [mengecekBlokir, setMengecekBlokir] = useState(false);
  const [pesanBlokir, setPesanBlokir] = useState<string | null>(null);
  const [sekarang, setSekarang] = useState(0);

  useEffect(() => {
    if (!sesi?.tutupPada) return;
    const cek = () => setSekarang(Date.now());
    const awal = window.setTimeout(cek, 0);
    const jadwal = window.setInterval(cek, 15_000);
    return () => {
      window.clearTimeout(awal);
      window.clearInterval(jadwal);
    };
  }, [sesi?.tutupPada]);

  const lewatBatas = Boolean(
    sesi?.tutupPada && sekarang > 0 && sekarang >= Date.parse(sesi.tutupPada),
  );

  // Belum memilih kuis → kembali ke halaman kode.
  useEffect(() => {
    if (sesi === null) router.replace("/siswa/gabung");
  }, [sesi, router]);

  useEffect(() => {
    if (!sesiId) return;
    let batal = false;
    ambilSoal(sesiId)
      .then((soal) => {
        if (batal) return;
        lepasBlokirLokal(sesiId);
        setMuatan({ status: "siap", soal });
      })
      .catch((err: unknown) => {
        if (batal) return;
        const status = err instanceof ErrorApi ? err.status : 0;
        if (status === 423) {
          setMuatan({ status: "diblokir" });
          return;
        }
        setMuatan({
          status: "gagal",
          pesan:
            status === 404
              ? "Kuis tidak ditemukan. Masukkan kode kelas lagi."
              : status === 409 && err instanceof ErrorApi
                ? err.message
                : "Soal belum berhasil dimuat. Periksa koneksi, lalu coba lagi.",
          sesiHilang: status === 404 || status === 409,
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

  if (muatan.status === "diblokir") {
    return (
      <KerangkaSiswa>
        <Lapisan>
          <LayarDiblokir
            onCek={() => {
              void cekBlokirDibuka(sesi.sesiId).then((hasil) => {
                if (hasil.dibuka) {
                  hapusCatatanPelanggaran(sesi.sesiId);
                  setMuatan({ status: "memuat" });
                  setPercobaan((n) => n + 1);
                } else {
                  setPesanBlokir(hasil.pesan);
                }
                setMengecekBlokir(false);
              });
              setMengecekBlokir(true);
              setPesanBlokir(null);
            }}
            mengecek={mengecekBlokir}
            pesanCek={pesanBlokir}
          />
        </Lapisan>
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
  const sudahDijawab = sudahTerjawabSoal(soalIni, jawaban[soalIni.id]);
  const mengirim = kiriman.status === "mengirim";

  async function kirim() {
    if (!sesi) return;
    // Jika siswa melompat nomor soal dan ada soal sebelumnya yang belum lengkap, arahkan ke soal tersebut.
    const belumLengkapIdx = soal.findIndex((s) => !sudahTerjawabSoal(s, jawaban[s.id]));
    if (belumLengkapIdx !== -1) {
      setIndeks(belumLengkapIdx);
      setKiriman({
        status: "gagal",
        pesan: `Lengkapi jawaban soal ${belumLengkapIdx + 1} terlebih dahulu.`,
        ditutup: false,
      });
      return;
    }

    setKiriman({ status: "mengirim" });
    try {
      const hasil = await kirimJawaban({
        sesiId: sesi.sesiId,
        jawaban: soal.map((s) => ({ soalId: s.id, pilihan: jawaban[s.id] })),
      });
      try {
        sessionStorage.setItem(
          "gp-hasil-kuis",
          JSON.stringify({
            sesiId: sesi.sesiId,
            skor: hasil.skor,
            total: hasil.total,
            menungguNilai: hasil.menungguNilai ?? 0,
          }),
        );
      } catch {
        // Penyimpanan tidak tersedia: halaman selesai tampil tanpa skor.
      }
      hapusCatatanPelanggaran(sesi.sesiId);
      router.replace("/siswa/selesai");
    } catch (err) {
      const status = err instanceof ErrorApi ? err.status : 0;
      const pesan =
        status === 0
          ? PESAN_GAGAL_KIRIM
          : err instanceof ErrorApi
            ? err.message
            : PESAN_GAGAL_KIRIM;
      if (status === 423) {
        setMuatan({ status: "diblokir" });
        setKiriman({ status: "diam" });
        return;
      }
      setKiriman({ status: "gagal", pesan, ditutup: status === 409 });
    }
  }

  function berikutnya() {
    if (terakhir) void kirim();
    else setIndeks((i) => i + 1);
  }

  const labelUtama = terakhir ? (kiriman.status === "gagal" ? "Coba lagi" : "Kirim jawaban") : "Berikutnya";
  const indeksTerjawab = new Set(
    soal.flatMap((s, i) => (sudahTerjawabSoal(s, jawaban[s.id]) ? [i] : [])),
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
        <p className="text-aura-muted">Ikuti petunjuk pada setiap soal. Kamu bisa kembali sebelum mengirim.</p>
        {sesi.tutupPada && (
          <p
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12px] leading-[18px] font-semibold ${
              lewatBatas ? 'bg-belum-latar text-belum-teks' : 'bg-aura-amber/10 text-[#92400e]'
            }`}
          >
            {lewatBatas
              ? 'Waktu kuis sudah lewat. Jawaban yang belum dikirim akan ditolak.'
              : `Ditutup otomatis ${formatJadwal(sesi.tutupPada)}`}
          </p>
        )}
      </header>
      <PemantauKuis sesiId={sesi.sesiId} />
      <ProgressKuis saatIni={indeks + 1} total={soal.length} />
      <KartuSoalKuis
        key={soalIni.id}
        nomor={soalIni.nomor}
        tipe={soalIni.tipe}
        teks={soalIni.teks}
        gambar={soalIni.gambar}
        pilihan={soalIni.pilihan}
        terpilih={jawaban[soalIni.id] ?? null}
        onPilih={(nilai) => {
          setJawaban((j) => ({ ...j, [soalIni.id]: nilai }));
          if (kiriman.status === "gagal") setKiriman({ status: "diam" });
        }}
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
