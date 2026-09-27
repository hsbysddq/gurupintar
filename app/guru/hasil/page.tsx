"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Sparkles, UserPlus } from "lucide-react";
import { GagalBuatMateri } from "@/components/GagalBuatMateri";
import { KartuKaca } from "@/components/KartuKaca";
import { KartuSoalTersulit } from "@/components/KartuSoalTersulit";
import { PetaKelas } from "@/components/PetaKelas";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { useBuatMateri } from "@/hooks/use-buat-materi";
import { usePolling } from "@/hooks/use-polling";
import { ambilHasil } from "@/lib/api-klien";
import { INTERVAL_POLLING_GURU_MS } from "@/lib/konstanta";

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function HalamanHasil() {
  return (
    <Suspense fallback={<StatusHalaman jenis="memuat" judul="Memuat hasil kuis" />}>
      <HasilKuis />
    </Suspense>
  );
}

// PRD F-5: dasbor hasil yang diperbarui otomatis lewat polling (architecture.md 7.2).
function HasilKuis() {
  const router = useRouter();
  const sesiId = useSearchParams().get("sesi");
  const ambil = useCallback((signal: AbortSignal) => ambilHasil(sesiId ?? "", signal), [sesiId]);
  const { data, galat, memuat, muatUlang } = usePolling(sesiId ? ambil : null, INTERVAL_POLLING_GURU_MS);
  const halamanMateri = `/guru/materi?sesi=${encodeURIComponent(sesiId ?? "")}`;
  const keHalamanMateri = useCallback(() => router.push(halamanMateri), [router, halamanMateri]);
  const pembuat = useBuatMateri(sesiId, keHalamanMateri);

  if (!sesiId) {
    return (
      <StatusHalaman
        jenis="kosong"
        judul="Pilih kuis terlebih dulu"
        pesan="Buka hasil dari riwayat kuis di dashboard."
        aksi={{ label: "Ke dashboard", onClick: () => router.push("/guru") }}
      />
    );
  }
  if (memuat) return <StatusHalaman jenis="memuat" judul="Memuat hasil kuis" />;
  if (!data) {
    return (
      <StatusHalaman
        jenis="gagal"
        judul="Hasil kuis belum berhasil dimuat"
        pesan={galat ?? undefined}
        aksi={{ label: "Coba lagi", onClick: muatUlang }}
      />
    );
  }

  const belumAdaJawaban = data.jumlahMenjawab === 0;
  const materiAda = data.statusMateri !== "belum-ada";
  const { keadaan, menyusun } = pembuat;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">Hasil cek pemahaman</h1>
        <p className="text-base leading-snug font-semibold">
          {data.sesi.namaTopik}, {data.sesi.namaKelas}
        </p>
        <p className="text-tinta-lembut">
          {FORMAT_TANGGAL.format(new Date(data.sesi.dibuatPada))} · Kode {data.sesi.kodeKelas} ·{" "}
          {data.sesi.status === "aktif" ? "Kuis masih dibuka" : "Kuis sudah ditutup"}
        </p>
        <p aria-live="polite" className="text-xl leading-snug font-semibold">
          {data.jumlahMenjawab} dari {data.jumlahSiswa} siswa menjawab
        </p>
        {galat && (
          <p role="status" className="text-[13px] leading-normal font-medium text-belum-teks">
            Pembaruan otomatis terputus. Data di bawah mungkin belum yang terbaru.
          </p>
        )}
      </header>

      <PetaKelas kelompok={data.kelompok} jumlahSiswa={data.jumlahSiswa} />

      <KartuSoalTersulit data={data.soalTersulit} jumlahMenjawab={data.jumlahMenjawab} />

      {/* AC-5.7: siswa baru menjawab setelah materi dibuat. */}
      {materiAda && data.kelompokTanpaMateri.length > 0 && keadaan.status !== "gagal-ai" && (
        <KartuKaca varian="pekat" className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p role="status" className="inline-flex items-center gap-2 font-semibold">
            <UserPlus aria-hidden="true" className="size-5 text-primer" />
            Ada siswa yang belum mendapat materi
          </p>
          <Tombol varian="sekunder" memuat={menyusun} onClick={() => void pembuat.buat()}>
            Buat materi yang kurang
          </Tombol>
        </KartuKaca>
      )}

      <div className="flex flex-col items-start gap-3">
        {keadaan.status === "gagal-ai" ? (
          <GagalBuatMateri
            sibuk={menyusun}
            onCobaLagi={pembuat.cobaLagi}
            onGunakanCadangan={pembuat.gunakanCadangan}
            onBatal={pembuat.batal}
          />
        ) : materiAda ? (
          <Tombol varian="utama" ikon={BookOpen} href={halamanMateri}>
            Lihat materi lanjutan
          </Tombol>
        ) : (
          <Tombol varian="utama" ikon={Sparkles} memuat={menyusun} disabled={belumAdaJawaban} onClick={() => void pembuat.buat()}>
            Buat Materi Lanjutan dengan AI
          </Tombol>
        )}
        <div aria-live="polite">
          {menyusun && (
            <p className="inline-flex items-center gap-2 font-semibold">
              <Sparkles aria-hidden="true" className="size-5 text-ai" />
              Menyusun materi untuk kelompok…
            </p>
          )}
          {keadaan.status === "ditolak" && (
            <p role="alert" className="font-medium text-belum-teks">
              {keadaan.pesan}
            </p>
          )}
        </div>
        {belumAdaJawaban && (
          <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Tombol aktif setelah ada siswa yang menjawab.
          </p>
        )}
        <Link href="/guru/pendampingan" className="inline-flex min-h-12 items-center px-2 font-semibold text-primer hover:underline">
          Lihat siswa yang perlu pendampingan
        </Link>
      </div>
    </div>
  );
}
