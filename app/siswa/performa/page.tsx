"use client";

import { useEffect, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { GrafikPerforma } from "@/components/GrafikPerforma";
import { KartuKaca } from "@/components/KartuKaca";
import { KerangkaSiswa } from "@/components/KerangkaSiswa";
import { StatusHalaman } from "@/components/StatusHalaman";
import { useSesiAktif } from "@/hooks/use-sesi-aktif";
import { Tombol } from "@/components/Tombol";
import {
  formatTanggalPanjang,
  hitungPersen,
  kalimatTren,
  ringkasPerforma,
  titikGrafik,
  type RiwayatKuis,
} from "@/lib/riwayat-siswa";

type Keadaan = { status: "memuat" } | { status: "gagal"; pesan: string } | { status: "siap"; daftar: RiwayatKuis[] };

const PESAN_GAGAL = "Riwayat belum bisa dimuat. Periksa koneksi, lalu coba lagi.";

// Dashboard performa dan riwayat kuis siswa. Menampilkan skor dan tren, tanpa label kelompok (D-2).
export default function HalamanPerforma() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "memuat" });

  const [percobaan, setPercobaan] = useState(0);
  const sesi = useSesiAktif();
  // Kuis terakhir yang dibuka menentukan tujuan tombol kembali; tanpa itu, ke daftar mata pelajaran.
  const hrefMapel = sesi?.kelasId ? `/siswa/kelas/detail?kelas=${encodeURIComponent(sesi.kelasId)}&tab=histori` : "/siswa/kelas";

  // setState hanya dipanggil dari callback asinkron; keadaan awal (dan saat "Coba lagi") sudah "memuat".
  useEffect(() => {
    const pengendali = new AbortController();
    fetch("/api/siswa/riwayat", { cache: "no-store", credentials: "same-origin", signal: pengendali.signal })
      .then((res) => {
        if (!res.ok) throw new Error(PESAN_GAGAL);
        return res.json() as Promise<RiwayatKuis[]>;
      })
      .then((daftar) => setKeadaan({ status: "siap", daftar }))
      .catch((err: unknown) => {
        if (pengendali.signal.aborted) return;
        setKeadaan({ status: "gagal", pesan: err instanceof Error && err.message ? err.message : PESAN_GAGAL });
      });
    return () => pengendali.abort();
  }, [percobaan]);

  const aksi = (
    <>
      <Tombol varian="utama" ukuran="besar" lebarPenuh href="/siswa/gabung">
        Masukkan kode kuis
      </Tombol>
      <div className="grid grid-cols-2 gap-3">
        <Tombol varian="sekunder" ukuran="besar" lebarPenuh href={hrefMapel}>
          Ke mata pelajaran
        </Tombol>
        <Tombol varian="sekunder" ukuran="besar" lebarPenuh href="/siswa">
          Ke beranda
        </Tombol>
      </div>
    </>
  );

  if (keadaan.status === "memuat") {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat performa belajar" />
      </KerangkaSiswa>
    );
  }

  if (keadaan.status === "gagal") {
    return (
      <KerangkaSiswa aksi={aksi}>
        <StatusHalaman jenis="gagal" judul="Belum bisa memuat" pesan={keadaan.pesan} aksi={{
            label: "Coba lagi",
            onClick: () => {
              setKeadaan({ status: "memuat" });
              setPercobaan((n) => n + 1);
            },
          }} />
      </KerangkaSiswa>
    );
  }

  const { daftar } = keadaan;
  if (daftar.length === 0) {
    return (
      <KerangkaSiswa aksi={aksi}>
        <StatusHalaman jenis="kosong" judul="Belum ada kuis" pesan="Setelah mengerjakan kuis, nilai dan perkembanganmu akan muncul di sini." />
      </KerangkaSiswa>
    );
  }

  const ringkas = ringkasPerforma(daftar);
  const titik = titikGrafik(daftar);
  const IkonTren = ringkas.perubahan === null || ringkas.perubahan === 0 ? Minus : ringkas.perubahan > 0 ? TrendingUp : TrendingDown;
  // Daftar riwayat: terbaru di atas (API sudah mengurutkan menurun).
  const terbaruDulu = [...daftar].sort((a, b) => b.dikirimPada.localeCompare(a.dikirimPada));

  return (
    <KerangkaSiswa aksi={aksi}>
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">Performa belajarku</h1>
        <p className="text-tinta-lembut">Lihat naik turunnya nilaimu dari kuis ke kuis.</p>
      </header>

      <section aria-label="Ringkasan" className="grid grid-cols-3 gap-2 sm:gap-3">
        <KartuStat label="Rata-rata" nilai={ringkas.rataRata === null ? "-" : `${ringkas.rataRata}%`} />
        <KartuStat label="Terbaik" nilai={ringkas.terbaik === null ? "-" : `${ringkas.terbaik}%`} />
        <KartuStat label="Kuis" nilai={String(ringkas.jumlahKuis)} />
      </section>

      <KartuKaca as="section" className="flex flex-col gap-3 p-5">
        <h2 className="text-xl leading-snug font-semibold">Perkembangan nilai</h2>
        <p className="flex items-start gap-2 text-[15px] leading-snug text-tinta-lembut">
          <IkonTren aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primer" />
          {kalimatTren(ringkas.perubahan)}
        </p>
        {titik.length >= 2 ? (
          <GrafikPerforma titik={titik} />
        ) : (
          <p className="rounded-kecil bg-primer-lembut p-4 text-[15px] text-tinta-lembut">
            Grafik muncul setelah kamu mengerjakan minimal dua kuis.
          </p>
        )}
      </KartuKaca>

      <section aria-labelledby="judul-riwayat" className="flex flex-col gap-3">
        <h2 id="judul-riwayat" className="text-xl leading-snug font-semibold">
          Riwayat kuis
        </h2>
        <ul className="flex flex-col gap-3">
          {terbaruDulu.map((k) => (
            <li key={`${k.sesiId}-${k.dikirimPada}`}>
              <KartuKaca className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{k.namaTopik}</p>
                  <p className="text-[13px] leading-normal text-tinta-lembut">
                    {k.namaKelas} · {formatTanggalPanjang(k.dikirimPada)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl leading-none font-bold text-primer">{hitungPersen(k.skor, k.total)}%</p>
                  <p className="text-[13px] leading-normal text-tinta-lembut">
                    {k.skor}/{k.total} benar
                  </p>
                </div>
              </KartuKaca>
            </li>
          ))}
        </ul>
      </section>
    </KerangkaSiswa>
  );
}

function KartuStat({ label, nilai }: { label: string; nilai: string }) {
  return (
    <KartuKaca className="flex min-w-0 flex-col items-center gap-1 p-2 text-center sm:p-3">
      <p className="text-xl leading-none font-bold sm:text-2xl">{nilai}</p>
      <p className="text-[11px] leading-normal text-tinta-lembut sm:text-[13px]">{label}</p>
    </KartuKaca>
  );
}
