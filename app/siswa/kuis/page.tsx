"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KartuSoalKuis } from "@/components/KartuSoalKuis";
import { KerangkaSiswa } from "@/components/KerangkaSiswa";
import { ProgressKuis } from "@/components/ProgressKuis";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { useSesiAktif } from "@/hooks/use-sesi-aktif";
import { ambilSoal, ErrorApi, kirimJawaban } from "@/lib/api-klien";
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

  return (
    <KerangkaSiswa
      aksi={
        <>
          {kiriman.status === "gagal" && (
            <p role="alert" className="text-belum-teks">
              {kiriman.pesan}
            </p>
          )}
          <Tombol
            varian="utama"
            ukuran="besar"
            lebarPenuh
            disabled={!sudahDijawab}
            memuat={mengirim}
            onClick={berikutnya}
          >
            {labelUtama}
          </Tombol>
          <div className="sm:hidden">
            <Tombol
              varian="sekunder"
              ukuran="besar"
              lebarPenuh
              disabled={indeks === 0 || mengirim}
              onClick={() => setIndeks((i) => i - 1)}
            >
              Sebelumnya
            </Tombol>
          </div>
          {indeks > 0 && (
            <div className="hidden sm:block">
              <Tombol
                varian="sekunder"
                ukuran="besar"
                lebarPenuh
                disabled={mengirim}
                onClick={() => setIndeks((i) => i - 1)}
              >
                Sebelumnya
              </Tombol>
            </div>
          )}
        </>
      }
    >
      <ProgressKuis saatIni={indeks + 1} total={soal.length} />
      <KartuSoalKuis
        key={soalIni.id}
        teks={soalIni.teks}
        pilihan={soalIni.pilihan}
        terpilih={jawaban[soalIni.id] ?? null}
        onPilih={(kode) => setJawaban((j) => ({ ...j, [soalIni.id]: kode as KodePilihan }))}
      />
    </KerangkaSiswa>
  );
}
