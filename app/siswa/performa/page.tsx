"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { BlokPerformaMapel } from "@/components/BlokPerformaMapel";
import { GrafikPerforma } from "@/components/GrafikPerforma";
import { KerangkaDasborSiswa } from "@/components/KerangkaDasborSiswa";
import { StatusHalaman } from "@/components/StatusHalaman";
import { useSesiAktif } from "@/hooks/use-sesi-aktif";
import {
  formatTanggalPanjang,
  hitungPersen,
  kalimatTren,
  petaJudulKuis,
  ringkasPerforma,
  titikGrafik,
} from "@/lib/riwayat-siswa";
import { susunPerformaMapel, type ResponsRiwayat } from "@/lib/status-mapel";

type Keadaan = { status: "memuat" } | { status: "gagal"; pesan: string } | { status: "siap"; data: ResponsRiwayat };

const PESAN_GAGAL = "Riwayat belum bisa dimuat. Periksa koneksi, lalu coba lagi.";

// Dashboard performa dan riwayat kuis siswa. Menampilkan skor dan tren, tanpa label kelompok (D-2).
export default function HalamanPerforma() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "memuat" });
  const [percobaan, setPercobaan] = useState(0);
  const sesi = useSesiAktif();
  const hrefMapel = sesi?.kelasId
    ? `/siswa/kelas/detail?kelas=${encodeURIComponent(sesi.kelasId)}&tab=histori`
    : "/siswa/kelas";

  useEffect(() => {
    const pengendali = new AbortController();
    fetch("/api/siswa/riwayat", { cache: "no-store", credentials: "same-origin", signal: pengendali.signal })
      .then((res) => {
        if (!res.ok) throw new Error(PESAN_GAGAL);
        return res.json() as Promise<ResponsRiwayat>;
      })
      .then((data) => setKeadaan({ status: "siap", data }))
      .catch((err: unknown) => {
        if (pengendali.signal.aborted) return;
        setKeadaan({ status: "gagal", pesan: err instanceof Error && err.message ? err.message : PESAN_GAGAL });
      });
    return () => pengendali.abort();
  }, [percobaan]);

  if (keadaan.status === "memuat") {
    return (
      <KerangkaDasborSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat performa belajar" />
      </KerangkaDasborSiswa>
    );
  }

  if (keadaan.status === "gagal") {
    return (
      <KerangkaDasborSiswa>
        <StatusHalaman
          jenis="gagal"
          judul="Belum bisa memuat"
          pesan={keadaan.pesan}
          aksi={{
            label: "Coba lagi",
            onClick: () => {
              setKeadaan({ status: "memuat" });
              setPercobaan((n) => n + 1);
            },
          }}
        />
      </KerangkaDasborSiswa>
    );
  }

  const { riwayat: daftar, mapel } = keadaan.data;
  if (daftar.length === 0) {
    return (
      <KerangkaDasborSiswa>
        <div className="aura-glass flex flex-col items-start gap-3 rounded-[24px] p-6">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/70">
            <Sparkles aria-hidden="true" className="size-5" />
          </span>
          <h1 className="font-display text-[22px] leading-[30px] font-bold text-aura-ink">Belum ada kuis</h1>
          <p className="max-w-xl font-body text-[14px] leading-[22px] text-aura-muted">
            Setelah mengerjakan kuis, nilai dan perkembanganmu akan muncul di sini.
          </p>
          <Link href="/siswa/gabung" className="aura-btn aura-btn-primary h-11 px-4 text-[13px]">
            Masukkan kode kuis
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </KerangkaDasborSiswa>
    );
  }

  const perMapel = susunPerformaMapel(mapel, daftar);
  const ringkas = ringkasPerforma(daftar);
  const titik = titikGrafik(daftar);
  const judulKuis = petaJudulKuis(daftar);
  const terbaruDulu = [...daftar].sort((a, b) => b.dikirimPada.localeCompare(a.dikirimPada));
  const IkonPerubahan =
    ringkas.perubahan === null || ringkas.perubahan === 0
      ? Minus
      : ringkas.perubahan > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <KerangkaDasborSiswa>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">
              Hasil belajar
            </span>
            <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
              Performa belajarku
            </h1>
            <p className="max-w-2xl font-body text-[14px] leading-[22px] text-aura-muted">
              Ringkasan semua kuis, lalu lihat perkembanganmu per mata pelajaran.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/siswa/gabung" className="aura-btn aura-btn-primary h-11 w-full px-4 text-[13px] sm:w-auto">
              Masukkan kode kuis
            </Link>
            <Link href={hrefMapel} className="aura-btn aura-btn-secondary h-11 w-full px-4 text-[13px] sm:w-auto">
              Ke mata pelajaran
            </Link>
          </div>
        </header>

        <section aria-label="Ringkasan performa" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KartuStatistik ikon={BookOpen} label="Total kuis" nilai={String(ringkas.jumlahKuis)} keterangan="sudah dikerjakan" />
          <KartuStatistik
            ikon={Target}
            label="Rata-rata"
            nilai={ringkas.rataRata === null ? "—" : `${ringkas.rataRata}%`}
            keterangan="semua kuis"
          />
          <KartuStatistik
            ikon={CheckCircle2}
            label="Nilai terbaik"
            nilai={ringkas.terbaik === null ? "—" : `${ringkas.terbaik}%`}
            keterangan="sepanjang riwayat"
          />
          <KartuStatistik
            ikon={IkonPerubahan}
            label="Perubahan terakhir"
            nilai={
              ringkas.perubahan === null
                ? "—"
                : `${ringkas.perubahan > 0 ? "+" : ""}${ringkas.perubahan}`
            }
            keterangan={ringkas.perubahan === null ? "belum ada pembanding" : "poin dari kuis sebelumnya"}
            warnaNilai={
              ringkas.perubahan === null || ringkas.perubahan === 0
                ? "text-aura-muted"
                : ringkas.perubahan > 0
                  ? "text-[#047857]"
                  : "text-[#B4432B]"
            }
          />
        </section>

        <section aria-labelledby="judul-grafik-semua" className="aura-glass rounded-[24px] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="aura-eyebrow">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Ringkasan semua kuis
              </span>
              <h2 id="judul-grafik-semua" className="mt-2 font-display text-[20px] leading-[28px] font-bold text-aura-ink">
                Perkembangan nilaimu
              </h2>
              <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">{kalimatTren(ringkas.perubahan)}</p>
            </div>
            <span className="rounded-full border border-white/60 bg-white/50 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-muted">
              {ringkas.jumlahKuis} kuis
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-white/60 bg-white/35 p-2 sm:p-3">
            {titik.length >= 2 ? (
              <GrafikPerforma titik={titik} />
            ) : (
              <p className="rounded-xl bg-white/45 px-4 py-8 text-center font-body text-[13px] leading-[20px] text-aura-muted">
                Grafik muncul setelah kamu mengerjakan minimal dua kuis.
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="judul-per-mapel" className="flex flex-col gap-4">
          <div>
            <h2 id="judul-per-mapel" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
              Per mata pelajaran
            </h2>
            <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
              Lihat status dan tren tiga kuis terakhir di tiap mapel.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {perMapel.map((m) => (
              <section key={m.kelasId} className="aura-glass flex flex-col gap-4 rounded-[24px] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-display text-[18px] leading-[26px] font-bold text-aura-ink">{m.namaMapel}</h3>
                    <p className="font-body text-[12px] leading-[18px] text-aura-muted">{m.namaKelas}</p>
                  </div>
                  <Link
                    href={`/siswa/kelas/detail?kelas=${encodeURIComponent(m.kelasId)}&tab=histori`}
                    className="inline-flex items-center gap-1 font-display text-[12px] font-semibold text-aura-primary hover:underline"
                  >
                    Buka mapel
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
                <BlokPerformaMapel riwayat={m.riwayat} hasil={m.hasil} />
              </section>
            ))}
          </div>
        </section>

        <section aria-labelledby="judul-riwayat" className="flex flex-col gap-3">
          <div>
            <h2 id="judul-riwayat" className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
              Riwayat kuis
            </h2>
            <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">Semua pengerjaan, terbaru di atas.</p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {terbaruDulu.map((k) => (
              <li key={`${k.sesiId}-${k.dikirimPada}`}>
                <article className="aura-glass flex items-start justify-between gap-3 rounded-[20px] p-4">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-display text-[14px] leading-[20px] font-semibold text-aura-ink">
                      {judulKuis.get(`${k.sesiId}-${k.dikirimPada}`) ?? k.namaTopik}
                    </p>
                    <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">
                      {k.namaMapel ? `${k.namaMapel} · ` : ""}
                      {k.namaKelas} · {formatTanggalPanjang(k.dikirimPada)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-[20px] leading-none font-extrabold text-aura-primary">
                      {hitungPersen(k.skor, k.total)}%
                    </p>
                    <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">
                      {k.skor}/{k.total} benar
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </KerangkaDasborSiswa>
  );
}

function KartuStatistik({
  ikon: Ikon,
  label,
  nilai,
  keterangan,
  warnaNilai = "text-aura-ink",
}: {
  ikon: LucideIcon;
  label: string;
  nilai: string;
  keterangan: string;
  warnaNilai?: string;
}) {
  return (
    <div className="aura-glass flex items-center gap-3 rounded-[20px] p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/70">
        <Ikon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-body text-[11px] leading-[16px] font-medium text-aura-muted">{label}</p>
        <p className={`font-display text-[24px] leading-[28px] font-extrabold tracking-[-0.02em] ${warnaNilai}`}>{nilai}</p>
        <p className="font-body text-[11px] leading-[16px] text-aura-muted">{keterangan}</p>
      </div>
    </div>
  );
}
