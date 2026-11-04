"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock, X } from "lucide-react";
import { GambarSoal } from "@/components/GambarSoal";
import { KerangkaDasborSiswa } from "@/components/KerangkaDasborSiswa";
import { KartuKaca } from "@/components/KartuKaca";
import { StatusHalaman } from "@/components/StatusHalaman";
import { ambilRincianHasil } from "@/lib/api-klien";
import { formatTanggalPanjang, hitungPersen } from "@/lib/riwayat-siswa";
import {
  adalahPilihanMenjodohkan,
  ambilDaftarPilihan,
  LABEL_TIPE_SOAL,
  uraiBenarSalah,
  uraiJawabanMenjodohkan,
  uraiKunciIsianSingkat,
  uraiPilganKompleks,
} from "@/lib/soal-tka";
import type { RincianJawabanSiswa } from "@/lib/tipe";

type Keadaan =
  | { status: "memuat" }
  | { status: "gagal"; pesan: string }
  | { status: "siap"; data: RincianJawabanSiswa };

type SoalRincian = RincianJawabanSiswa["soal"][number];

export default function HalamanHasilKuis() {
  return (
    <Suspense
      fallback={
        <KerangkaDasborSiswa>
          <StatusHalaman jenis="memuat" judul="Memuat rincian jawaban" />
        </KerangkaDasborSiswa>
      }
    >
      <IsiHasilKuis />
    </Suspense>
  );
}

function IsiHasilKuis() {
  const params = useSearchParams();
  const sesiId = params.get("sesi");
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "memuat" });

  useEffect(() => {
    if (!sesiId) return;

    const pengendali = new AbortController();
    ambilRincianHasil(sesiId, pengendali.signal)
      .then((data) => setKeadaan({ status: "siap", data }))
      .catch((err: unknown) => {
        if (pengendali.signal.aborted) return;
        setKeadaan({
          status: "gagal",
          pesan: err instanceof Error ? err.message : "Rincian jawaban belum bisa dimuat.",
        });
      });
    return () => pengendali.abort();
  }, [sesiId]);

  if (!sesiId) {
    return (
      <KerangkaDasborSiswa>
        <StatusHalaman
          jenis="gagal"
          judul="Pilih kuis dulu"
          pesan="Buka rincian jawaban dari halaman performa atau setelah menyelesaikan kuis."
        />
      </KerangkaDasborSiswa>
    );
  }

  if (keadaan.status === "memuat") {
    return (
      <KerangkaDasborSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat rincian jawaban" />
      </KerangkaDasborSiswa>
    );
  }

  if (keadaan.status === "gagal") {
    return (
      <KerangkaDasborSiswa>
        <StatusHalaman jenis="gagal" judul="Rincian belum tersedia" pesan={keadaan.pesan} />
      </KerangkaDasborSiswa>
    );
  }

  const { data } = keadaan;
  const belumDinilai = data.soal.filter((s) => s.belumDinilai).length;
  const salah = Math.max(0, data.total - data.skor - belumDinilai);
  const persen = hitungPersen(data.skor, data.total);

  return (
    <KerangkaDasborSiswa>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/siswa/performa"
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] leading-normal font-semibold text-aura-muted hover:text-aura-primary"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali ke performa
          </Link>
        </div>

        <header className="flex flex-col gap-1.5">
          <span className="aura-eyebrow">Rincian jawaban</span>
          <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
            {data.sesi.namaTopik}
          </h1>
          <p className="text-aura-muted">
            {data.sesi.namaKelas} · {data.sesi.namaMapel} · {formatTanggalPanjang(data.sesi.dikirimPada)}
          </p>
          <p className="text-[13px] leading-normal text-aura-muted">Menampilkan pengerjaan terakhir untuk kuis ini.</p>
        </header>

        <section aria-labelledby="ringkasan-rincian" className="aura-glass rounded-[24px] p-5 sm:p-6">
          <h2 id="ringkasan-rincian" className="font-display text-[18px] leading-snug font-bold text-aura-ink">
            Ringkasan hasil
          </h2>
          <div className={`mt-4 grid grid-cols-1 gap-3 ${belumDinilai > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <div className="rounded-2xl bg-aura-primary/5 p-4">
              <p className="text-[12px] leading-normal text-aura-muted">
                {belumDinilai > 0 ? "Nilai sementara" : "Nilai"}
              </p>
              <p className="font-display text-[30px] leading-tight font-extrabold text-aura-primary">{persen}%</p>
            </div>
            <div className="rounded-2xl bg-sudah-latar p-4">
              <p className="text-[12px] leading-normal text-sudah-teks">Benar</p>
              <p className="font-display text-[30px] leading-tight font-extrabold text-sudah-teks">{data.skor}</p>
            </div>
            <div className="rounded-2xl bg-belum-latar p-4">
              <p className="text-[12px] leading-normal text-belum-teks">Salah</p>
              <p className="font-display text-[30px] leading-tight font-extrabold text-belum-teks">{salah}</p>
            </div>
            {belumDinilai > 0 && (
              <div className="rounded-2xl bg-setengah-latar p-4">
                <p className="text-[12px] leading-normal text-setengah-teks">Menunggu nilai guru</p>
                <p className="font-display text-[30px] leading-tight font-extrabold text-setengah-teks">
                  {belumDinilai}
                </p>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="daftar-rincian" className="flex flex-col gap-4">
          <div>
            <h2 id="daftar-rincian" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
              Soal dan jawabanmu
            </h2>
            <p className="mt-1 text-[13px] leading-normal text-aura-muted">
              Hijau adalah kunci benar, merah adalah jawabanmu yang belum tepat.
            </p>
          </div>

          <ol className="flex flex-col gap-4">
            {data.soal.map((s) => (
              <li key={s.id}>
                <KartuKaca as="article" className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold ${
                        s.belumDinilai
                          ? "bg-setengah-latar text-setengah-teks"
                          : s.benar
                            ? "bg-sudah-latar text-sudah-teks"
                            : "bg-belum-latar text-belum-teks"
                      }`}
                    >
                      {s.nomor}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-aura-primary/10 px-2.5 py-0.5 font-display text-[10px] font-bold text-aura-primary">
                          {LABEL_TIPE_SOAL[s.tipe ?? "pilgan"]}
                        </span>
                        {s.belumDinilai ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-setengah-teks">
                            <Clock aria-hidden="true" className="size-3.5" />
                            Menunggu dinilai guru
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
                              s.benar ? "text-sudah-teks" : "text-belum-teks"
                            }`}
                          >
                            {s.benar ? (
                              <Check aria-hidden="true" className="size-3.5" />
                            ) : (
                              <X aria-hidden="true" className="size-3.5" />
                            )}
                            {s.benar ? "Benar" : "Salah"}
                          </span>
                        )}
                      </div>
                      <p className="font-display text-[15px] leading-snug font-semibold text-aura-ink">{s.teks}</p>
                    </div>
                  </div>

                  {s.gambar && <GambarSoal src={s.gambar} alt={`Gambar soal ${s.nomor}`} ringkas />}

                  <RincianIsiSoal soal={s} />

                  {!s.pilihanSiswa && (
                    <p className="text-[12px] leading-normal text-aura-muted">
                      Tidak ada jawaban tersimpan untuk soal ini.
                    </p>
                  )}
                </KartuKaca>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link href="/siswa/performa" className="aura-btn aura-btn-secondary min-h-11 px-4 text-[13px]">
            Kembali ke performa
          </Link>
          <Link href="/siswa/kelas" className="aura-btn aura-btn-secondary min-h-11 px-4 text-[13px]">
            Ke mata pelajaran
          </Link>
        </div>
      </div>
    </KerangkaDasborSiswa>
  );
}

function RincianIsiSoal({ soal }: { soal: SoalRincian }) {
  const tipe = soal.tipe ?? "pilgan";

  if (tipe === "pilgan" || tipe === "pilgan_kompleks") {
    const daftarPilihan = ambilDaftarPilihan(soal.pilihan);
    const dipilihSet = new Set(
      tipe === "pilgan"
        ? soal.pilihanSiswa
          ? [soal.pilihanSiswa]
          : []
        : uraiPilganKompleks(soal.pilihanSiswa),
    );
    const kunciSet = new Set(tipe === "pilgan" ? [soal.kunci] : uraiPilganKompleks(soal.kunci));

    return (
      <ul className="flex flex-col gap-2">
        {daftarPilihan.map((p) => {
          const dipilih = dipilihSet.has(p.kode);
          const kunci = kunciSet.has(p.kode);
          return (
            <li
              key={p.kode}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] leading-normal ${
                kunci
                  ? "border-sudah/30 bg-sudah-latar text-sudah-teks"
                  : dipilih
                    ? "border-belum/30 bg-belum-latar text-belum-teks"
                    : "border-white/60 bg-white/40 text-aura-muted"
              }`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/70 font-display text-[11px] font-bold">
                {p.kode}
              </span>
              <span className="min-w-0 flex-1">{p.teks}</span>
              {kunci && dipilih && <span className="shrink-0 text-[11px] font-semibold">Jawabanmu · Kunci</span>}
              {kunci && !dipilih && <span className="shrink-0 text-[11px] font-semibold">Kunci</span>}
              {dipilih && !kunci && <span className="shrink-0 text-[11px] font-semibold">Jawabanmu</span>}
            </li>
          );
        })}
      </ul>
    );
  }

  if (tipe === "benar_salah") {
    const daftar = ambilDaftarPilihan(soal.pilihan);
    const isianSiswa = uraiBenarSalah(soal.pilihanSiswa, daftar.length);
    const kunciBaris = uraiBenarSalah(soal.kunci, daftar.length);

    return (
      <ul className="flex flex-col gap-2">
        {daftar.map((p, idx) => {
          const jSiswa = isianSiswa[idx];
          const jKunci = kunciBaris[idx];
          const tepat = jSiswa !== "" && jSiswa === jKunci;
          const labelBS = (v: string) => (v === "B" ? "Benar" : v === "S" ? "Salah" : "-");
          return (
            <li
              key={p.kode}
              className={`flex flex-col justify-between gap-2 rounded-xl border px-3 py-2.5 text-[13px] sm:flex-row sm:items-center ${
                tepat ? "border-sudah/30 bg-sudah-latar text-sudah-teks" : "border-belum/30 bg-belum-latar text-belum-teks"
              }`}
            >
              <span className="min-w-0 flex-1 font-medium">
                {p.kode}. {p.teks}
              </span>
              <span className="shrink-0 text-[12px] font-semibold">
                Jawabanmu: {labelBS(jSiswa)} · Kunci: {labelBS(jKunci)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (tipe === "isian_singkat") {
    const daftarKunci = uraiKunciIsianSingkat(soal.kunci);
    return (
      <div className="flex flex-col gap-2 text-[13px]">
        <div
          className={`rounded-xl border px-3 py-2.5 ${
            soal.benar ? "border-sudah/30 bg-sudah-latar text-sudah-teks" : "border-belum/30 bg-belum-latar text-belum-teks"
          }`}
        >
          <span className="font-semibold">Jawabanmu: </span>
          <span>{soal.pilihanSiswa ?? "-"}</span>
        </div>
        <div className="rounded-xl border border-sudah/30 bg-sudah-latar px-3 py-2.5 text-sudah-teks">
          <span className="font-semibold">Kunci yang diterima: </span>
          <span>{daftarKunci.join(" / ")}</span>
        </div>
      </div>
    );
  }

  if (tipe === "menjodohkan" && adalahPilihanMenjodohkan(soal.pilihan)) {
    const petaSiswa = uraiJawabanMenjodohkan(soal.pilihanSiswa);
    const petaKunci = uraiJawabanMenjodohkan(soal.kunci);
    const teksKanan = new Map(soal.pilihan.kanan.map((k) => [k.kode, k.teks]));

    return (
      <ul className="flex flex-col gap-2">
        {soal.pilihan.kiri.map((kr) => {
          const kodeSiswa = petaSiswa[kr.kode] ?? "";
          const kodeKunci = petaKunci[kr.kode] ?? "";
          const tepat = Boolean(kodeSiswa) && kodeSiswa === kodeKunci;
          return (
            <li
              key={kr.kode}
              className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-[13px] ${
                tepat ? "border-sudah/30 bg-sudah-latar text-sudah-teks" : "border-belum/30 bg-belum-latar text-belum-teks"
              }`}
            >
              <span className="font-semibold">
                {kr.kode}. {kr.teks}
              </span>
              <span className="text-[12px]">
                Jawabanmu: <strong>{teksKanan.get(kodeSiswa) ?? "-"}</strong>
                {!tepat && (
                  <>
                    {" "}
                    · Kunci: <strong>{teksKanan.get(kodeKunci) ?? "-"}</strong>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  // Esai
  return (
    <div className="flex flex-col gap-2 text-[13px]">
      <div
        className={`rounded-xl border px-3.5 py-3 ${
          soal.belumDinilai
            ? "border-setengah/30 bg-setengah-latar/60 text-aura-ink"
            : soal.benar
              ? "border-sudah/30 bg-sudah-latar text-sudah-teks"
              : "border-belum/30 bg-belum-latar text-belum-teks"
        }`}
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-wider opacity-80">Jawabanmu</p>
        <p className="mt-1 whitespace-pre-wrap leading-relaxed">{soal.pilihanSiswa ?? "-"}</p>
      </div>
      {!soal.belumDinilai && soal.kunci && (
        <div className="rounded-xl border border-aura-primary/20 bg-aura-primary/5 px-3.5 py-2.5 text-aura-ink">
          <span className="font-semibold">Pedoman jawaban: </span>
          <span>{soal.kunci}</span>
        </div>
      )}
    </div>
  );
}
