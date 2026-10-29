"use client";

import { Suspense, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CircleCheck, Clock3, TrendingDown, TrendingUp, Users } from "lucide-react";
import { DaftarKemajuan } from "@/components/DaftarKemajuan";
import { LabelHanyaGuru } from "@/components/LabelHanyaGuru";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabelPendampingan } from "@/components/TabelPendampingan";
import { ambilDaftarKelas, ambilPendampingan } from "@/lib/api-klien";
import {
  ALASAN_BELUM_PAHAM,
  ALASAN_MENURUN,
  ALASAN_TIDAK_MENGERJAKAN,
  JUMLAH_CEK_TIDAK_MENGERJAKAN,
  JUMLAH_SESI_JENDELA,
  SARAN_BELUM_PAHAM,
  SARAN_MENURUN,
  SARAN_TIDAK_MENGERJAKAN,
} from "@/lib/pendampingan";
import type { DataPendampingan, KelasRingkas } from "@/lib/tipe";

type Muatan =
  | { status: "memuat" }
  | { status: "gagal"; pesan: string; kelasId: string }
  | { status: "siap"; data: DataPendampingan; kelasId: string };

// PRD F-8, design.md 3.5.
export default function HalamanPendampingan() {
  return (
    <Suspense fallback={<StatusHalaman jenis="memuat" judul="Memuat daftar pendampingan" />}>
      <IsiPendampingan />
    </Suspense>
  );
}

function IsiPendampingan() {
  const router = useRouter();
  const params = useSearchParams();
  const kelasDariUrl = params.get("kelas") ?? "";
  const idKelas = useId();
  const [percobaan, setPercobaan] = useState(0);
  const [muatan, setMuatan] = useState<Muatan>({ status: "memuat" });
  const [daftarKelas, setDaftarKelas] = useState<KelasRingkas[] | null>(null);
  const [kelasPilihan, setKelasPilihan] = useState(kelasDariUrl);

  // Pendampingan sekarang selalu dibuka dari tab kelas; tanpa ?kelas= kembali ke daftar.
  useEffect(() => {
    if (!kelasDariUrl) router.replace("/guru");
  }, [kelasDariUrl, router]);

  useEffect(() => {
    let batal = false;
    ambilDaftarKelas()
      .then((daftar) => {
        if (!batal) setDaftarKelas(daftar);
      })
      .catch(() => {
        if (!batal) setDaftarKelas([]);
      });
    return () => {
      batal = true;
    };
  }, []);

  // Kelas aktif diturunkan dari URL; jika tidak valid, pakai pilihan terakhir atau kelas pertama.
  const kelasDariDaftar = daftarKelas?.some((k) => k.id === kelasDariUrl) ? kelasDariUrl : null;
  const kelasId =
    kelasDariDaftar ??
    (daftarKelas && !daftarKelas.some((k) => k.id === kelasPilihan)
      ? (daftarKelas[0]?.id ?? "")
      : kelasPilihan);

  useEffect(() => {
    if (!kelasId) return;
    const idKelasAktif = kelasId;
    const pengendali = new AbortController();
    ambilPendampingan(idKelasAktif, pengendali.signal)
      .then((data) => setMuatan({ status: "siap", data, kelasId: idKelasAktif }))
      .catch((err: unknown) => {
        if (pengendali.signal.aborted) return;
        setMuatan({
          status: "gagal",
          pesan: err instanceof Error ? err.message : "Data belum berhasil dimuat.",
          kelasId: idKelasAktif,
        });
      });
    return () => pengendali.abort();
  }, [percobaan, kelasId]);

  const dataSiap = muatan.status === "siap" && muatan.kelasId === kelasId ? muatan.data : null;
  const pesanGagal = muatan.status === "gagal" && muatan.kelasId === kelasId ? muatan.pesan : null;
  const ringkasan = dataSiap?.ringkasan;
  const butuhPola = ringkasan ? Math.max(0, JUMLAH_SESI_JENDELA - ringkasan.jumlahSesiBerjawaban) : 0;
  const butuhSelesai = ringkasan ? Math.max(0, JUMLAH_CEK_TIDAK_MENGERJAKAN - ringkasan.jumlahSesiSelesai) : 0;
  const kelasChip =
    "inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">
            Pendampingan
          </span>
          <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
            Perlu pendampingan
          </h1>
          <p className="max-w-2xl font-body text-[14px] leading-[22px] text-aura-muted">
            Sistem menandai siswa dari pola jawaban beberapa cek terakhir. Sesi tanpa jawaban tidak dihitung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {daftarKelas && daftarKelas.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor={idKelas} className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                Kelas
              </label>
              <select
                id={idKelas}
                value={kelasId}
                onChange={(e) => {
                  const id = e.target.value;
                  setMuatan({ status: "memuat" });
                  setKelasPilihan(id);
                  router.replace(`/guru/pendampingan?kelas=${encodeURIComponent(id)}`);
                }}
                className="h-11 rounded-2xl border border-white/70 bg-white/70 px-3 font-body text-[14px] text-aura-ink shadow-sm backdrop-blur-sm"
              >
                {daftarKelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.mapel} · {k.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
          <LabelHanyaGuru />
        </div>
      </header>

      <section
        aria-labelledby="judul-alur-pendampingan"
        className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-aura-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-aura-primary">
              Alur pendampingan
            </span>
            <h2 id="judul-alur-pendampingan" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
              Kapan siswa masuk daftar?
            </h2>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Setiap siswa dinilai dari maksimal {JUMLAH_SESI_JENDELA} cek terakhir yang ia jawab. Aturan 3x dan tren
              menurun butuh {JUMLAH_SESI_JENDELA} cek berjawaban; aturan tidak mengerjakan butuh{" "}
              {JUMLAH_CEK_TIDAK_MENGERJAKAN} cek selesai.
            </p>
          </div>

          <ul className="grid gap-3 md:grid-cols-3">
            <li className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-aura-amber/10 text-aura-amber">
                <AlertTriangle aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-2 font-display text-[13px] leading-[20px] font-semibold text-aura-ink">
                {ALASAN_BELUM_PAHAM}
              </p>
              <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">{SARAN_BELUM_PAHAM}</p>
            </li>
            <li className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-aura-red/10 text-aura-red">
                <Clock3 aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-2 font-display text-[13px] leading-[20px] font-semibold text-aura-ink">
                {ALASAN_TIDAK_MENGERJAKAN}
              </p>
              <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">{SARAN_TIDAK_MENGERJAKAN}</p>
            </li>
            <li className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-aura-violet/10 text-aura-violet">
                <TrendingDown aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-2 font-display text-[13px] leading-[20px] font-semibold text-aura-ink">
                {ALASAN_MENURUN}
              </p>
              <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">{SARAN_MENURUN}</p>
            </li>
          </ul>

          <div className="flex items-start gap-2 rounded-2xl border border-aura-emerald/20 bg-aura-emerald/5 px-3 py-2.5">
            <TrendingUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#047857]" />
            <p className="font-body text-[12px] leading-[18px] text-aura-muted">
              <strong className="font-semibold text-aura-ink">Kemajuan:</strong> siswa yang sebelumnya belum paham lalu
              naik ke setengah atau sudah paham.
            </p>
          </div>
        </div>
      </section>

      {ringkasan && (
        <section aria-labelledby="judul-data-pendampingan" className="aura-glass rounded-[24px] p-4 sm:p-5">
          <h2 id="judul-data-pendampingan" className="sr-only">
            Status data pendampingan
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className={kelasChip}>
              <Users aria-hidden="true" className="size-4 text-aura-primary" />
              {ringkasan.jumlahSiswa} siswa
            </span>
            <span className={kelasChip}>
              <CircleCheck aria-hidden="true" className="size-4 text-aura-emerald" />
              {ringkasan.jumlahSesiBerjawaban} cek berjawaban
            </span>
            <span className={kelasChip}>
              <Clock3 aria-hidden="true" className="size-4 text-aura-indigo" />
              {ringkasan.jumlahSesiSelesai} cek selesai
            </span>
          </div>
          <p className="mt-3 font-body text-[12px] leading-[18px] text-aura-muted">
            {butuhPola > 0
              ? `Butuh ${butuhPola} cek berjawaban lagi agar aturan 3x berturut-turut dan tren menurun bisa aktif.`
              : "Aturan 3x berturut-turut dan tren menurun sudah aktif."}{" "}
            {butuhSelesai > 0
              ? `Butuh ${butuhSelesai} cek selesai lagi agar aturan tidak mengerjakan bisa aktif.`
              : "Aturan tidak mengerjakan sudah aktif."}
          </p>
          {butuhPola === 0 && butuhSelesai === 0 && (
            <p className="mt-2 font-body text-[12px] leading-[18px] text-aura-muted">
              Semua aturan sudah aktif. Daftar di bawah hanya menampilkan siswa yang memenuhi kriteria.
            </p>
          )}
          {ringkasan.jumlahSesiBerjawaban === 0 && (
            <Link
              href={`/guru/kelas?kelas=${encodeURIComponent(kelasId)}`}
              className="mt-3 inline-flex items-center gap-1.5 font-display text-[12px] font-semibold text-aura-primary hover:underline"
            >
              Buka kuis pertama
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          )}
        </section>
      )}

      {daftarKelas && daftarKelas.length === 0 && (
        <StatusHalaman jenis="kosong" judul="Belum ada kelas" pesan="Buat kelas di dashboard sebelum melihat pendampingan." />
      )}
      {(!daftarKelas || daftarKelas.length > 0) && !dataSiap && !pesanGagal && (
        <StatusHalaman jenis="memuat" judul="Memuat daftar pendampingan" />
      )}
      {pesanGagal && (
        <StatusHalaman
          jenis="gagal"
          judul="Daftar pendampingan belum berhasil dimuat"
          pesan={pesanGagal}
          aksi={{
            label: "Coba lagi",
            onClick: () => {
              setMuatan({ status: "memuat" });
              setPercobaan((p) => p + 1);
            },
          }}
        />
      )}
      {dataSiap && (
        <>
          <section aria-labelledby="judul-pendampingan" className="flex flex-col gap-3">
            <h2 id="judul-pendampingan" className="sr-only">
              Daftar perlu pendampingan
            </h2>
            <TabelPendampingan data={dataSiap.perluPendampingan} />
          </section>
          <section aria-labelledby="judul-kemajuan" className="flex flex-col gap-3">
            <h2 id="judul-kemajuan" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
              Mengalami kemajuan
            </h2>
            <DaftarKemajuan data={dataSiap.kemajuan} />
          </section>
        </>
      )}
    </div>
  );
}
