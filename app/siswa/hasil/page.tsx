"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { KerangkaDasborSiswa } from "@/components/KerangkaDasborSiswa";
import { KartuKaca } from "@/components/KartuKaca";
import { StatusHalaman } from "@/components/StatusHalaman";
import { ambilRincianHasil } from "@/lib/api-klien";
import { formatTanggalPanjang, hitungPersen } from "@/lib/riwayat-siswa";
import type { RincianJawabanSiswa } from "@/lib/tipe";

type Keadaan =
  | { status: "memuat" }
  | { status: "gagal"; pesan: string }
  | { status: "siap"; data: RincianJawabanSiswa };

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
  const salah = data.total - data.skor;
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
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-aura-primary/5 p-4">
              <p className="text-[12px] leading-normal text-aura-muted">Nilai</p>
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
          </div>
        </section>

        <section aria-labelledby="daftar-rincian" className="flex flex-col gap-4">
          <div>
            <h2 id="daftar-rincian" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
              Soal dan jawabanmu
            </h2>
            <p className="mt-1 text-[13px] leading-normal text-aura-muted">Hijau adalah jawaban benar, merah adalah pilihanmu yang salah.</p>
          </div>

          <ol className="flex flex-col gap-4">
            {data.soal.map((s) => (
              <li key={s.id}>
                <KartuKaca as="article" className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold ${
                        s.benar ? "bg-sudah-latar text-sudah-teks" : "bg-belum-latar text-belum-teks"
                      }`}
                    >
                      {s.nomor}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[15px] leading-snug font-semibold text-aura-ink">{s.teks}</p>
                      <p className={`mt-1 inline-flex items-center gap-1 text-[12px] font-semibold ${s.benar ? "text-sudah-teks" : "text-belum-teks"}`}>
                        {s.benar ? <Check aria-hidden="true" className="size-3.5" /> : <X aria-hidden="true" className="size-3.5" />}
                        {s.benar ? "Benar" : "Salah"}
                      </p>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {s.pilihan.map((p) => {
                      const dipilih = p.kode === s.pilihanSiswa;
                      const kunci = p.kode === s.kunci;
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
                          {kunci && <span className="shrink-0 text-[11px] font-semibold">Kunci</span>}
                          {dipilih && !kunci && <span className="shrink-0 text-[11px] font-semibold">Jawabanmu</span>}
                          {dipilih && kunci && <span className="shrink-0 text-[11px] font-semibold">Jawabanmu</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {!s.pilihanSiswa && (
                    <p className="text-[12px] leading-normal text-aura-muted">Tidak ada jawaban tersimpan untuk soal ini.</p>
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
