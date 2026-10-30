"use client";

import { Suspense, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Info,
  TrendingUp,
  Users,
} from "lucide-react";
import { LabelHanyaGuru } from "@/components/LabelHanyaGuru";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabelPendampingan } from "@/components/TabelPendampingan";
import {
  ambilDaftarKelas,
  ambilPendampingan,
  simpanTindakanPendampingan,
} from "@/lib/api-klien";
import { BATAS_PAHAM, BATAS_SETENGAH, JUMLAH_KUIS } from "@/lib/pendampingan";
import type { DataPendampingan, KelasRingkas, TindakanPendampingan } from "@/lib/tipe";

type Muatan =
  | { status: "memuat" }
  | { status: "gagal"; pesan: string; kelasId: string }
  | { status: "siap"; data: DataPendampingan; kelasId: string };

// Alur: rata-rata 3 kuis selesai terakhir → Paham / Setengah Paham / Belum Paham.
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
  const [menyimpan, setMenyimpan] = useState<string | null>(null);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

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
  const siswa = dataSiap?.siswa ?? [];
  const menunggu = siswa.filter((s) => s.status === "menunggu");
  const pendampingan = siswa.filter((s) => s.status === "pendampingan");
  const evaluasi = siswa.filter((s) => s.status === "evaluasi" || s.status === "selesai");
  const paham = siswa.filter((s) => s.kategori === "paham");
  const nonaktif = Boolean(ringkasan?.perluMigrasi) || menyimpan !== null;
  const kelasChip =
    "inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink";

  async function ubahTindakan(siswaId: string, tindakan: TindakanPendampingan) {
    if (!kelasId) return;
    setMenyimpan(`${siswaId}:${tindakan}`);
    setGalatAksi(null);
    try {
      await simpanTindakanPendampingan({ kelasId, siswaId, tindakan });
      setPercobaan((p) => p + 1);
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Tindakan belum berhasil disimpan.");
    } finally {
      setMenyimpan(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">
            Pendampingan
          </span>
          <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
            Peta pemahaman & tindakan
          </h1>
          <p className="max-w-2xl font-body text-[14px] leading-[22px] text-aura-muted">
            Rata-rata {JUMLAH_KUIS} kuis selesai terakhir di kelas ini menentukan kategori. Setengah paham
            menunggu keputusan guru; belum paham dan yang tidak mengerjakan langsung masuk pendampingan.
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
                  setGalatAksi(null);
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
              Bagaimana siswa masuk daftar?
            </h2>
            <p className="font-body text-[13px] leading-[20px] text-aura-muted">
              Ambil {JUMLAH_KUIS} kuis selesai terakhir, hitung rata-rata, lalu tentukan tindakan. Siswa yang
              belum mengerjakan ketiganya masuk pendampingan.
            </p>
          </div>

          <ul className="grid gap-3 md:grid-cols-3">
            <li className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                <Clock3 aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-2 font-display text-[13px] leading-[20px] font-semibold text-aura-ink">
                3 kuis selesai terakhir
              </p>
              <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">
                Diambil dari kelas/mapel yang sedang dipilih.
              </p>
            </li>
            <li className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-aura-emerald/10 text-[#047857]">
                <TrendingUp aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-2 font-display text-[13px] leading-[20px] font-semibold text-aura-ink">
                Rata-rata nilai
              </p>
              <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">
                ≥{BATAS_PAHAM}% Paham · {BATAS_SETENGAH}–&lt;{BATAS_PAHAM}% Setengah Paham · &lt;
                {BATAS_SETENGAH}% Belum Paham.
              </p>
            </li>
            <li className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-aura-amber/10 text-[#8A6400]">
                <CircleHelp aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-2 font-display text-[13px] leading-[20px] font-semibold text-aura-ink">
                Tindakan
              </p>
              <p className="mt-1 font-body text-[12px] leading-[18px] text-aura-muted">
                Belum paham dan tidak mengerjakan → pendampingan. Setengah paham → keputusan guru.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {ringkasan?.perluMigrasi && (
        <section className="flex items-start gap-2 rounded-2xl border border-aura-amber/25 bg-aura-amber/10 px-4 py-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#8A6400]" />
          <p className="font-body text-[12px] leading-[18px] font-medium text-aura-ink">
            Keputusan guru belum bisa disimpan. Jalankan{' '}
            <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
              supabase/migrasi-tindakan-pendampingan.sql
            </code>{' '}
            di Supabase SQL Editor.
          </p>
        </section>
      )}

      {ringkasan && (
        <section aria-labelledby="judul-data-pendampingan" className="aura-glass rounded-[24px] p-4 sm:p-5">
          <h2 id="judul-data-pendampingan" className="sr-only">
            Ringkasan kategori pemahaman
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className={kelasChip}>
              <Users aria-hidden="true" className="size-4 text-aura-primary" />
              {ringkasan.jumlahSiswa} siswa
            </span>
            <span className={kelasChip}>
              <CheckCircle2 aria-hidden="true" className="size-4 text-aura-emerald" />
              {ringkasan.jumlahSesiSelesai} kuis selesai
            </span>
            <span className={kelasChip}>Paham {ringkasan.jumlahPaham}</span>
            <span className={kelasChip}>Setengah {ringkasan.jumlahSetengah}</span>
            <span className={kelasChip}>Belum {ringkasan.jumlahBelum}</span>
            <span className={kelasChip}>Tidak mengerjakan {ringkasan.jumlahTidakMengerjakan}</span>
          </div>
          {ringkasan.butuhSesi > 0 && (
            <p className="mt-3 flex items-start gap-1.5 font-body text-[12px] leading-[18px] text-aura-muted">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-aura-primary" />
              Butuh {ringkasan.butuhSesi} kuis selesai lagi sebelum kategori bisa dihitung.
            </p>
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

      {galatAksi && (
        <p role="alert" className="rounded-2xl border border-aura-red/20 bg-aura-red/5 px-4 py-3 font-body text-[13px] leading-[20px] font-medium text-aura-red">
          {galatAksi}
        </p>
      )}

      {dataSiap && ringkasan && ringkasan.butuhSesi > 0 && (
        <section className="aura-glass flex flex-col items-start gap-3 rounded-[24px] p-5 sm:p-6">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/70">
            <Clock3 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">
              Butuh {ringkasan.butuhSesi} kuis selesai lagi
            </h2>
            <p className="mt-1 max-w-2xl font-body text-[13px] leading-[20px] text-aura-muted">
              Saat ini baru {ringkasan.jumlahSesiSelesai} kuis selesai. Kategori baru dihitung setelah{' '}
              {JUMLAH_KUIS} kuis selesai.
            </p>
          </div>
          {ringkasan.jumlahSesiSelesai === 0 && (
            <Link
              href={`/guru/kelas?kelas=${encodeURIComponent(kelasId)}`}
              className="aura-btn aura-btn-primary h-11 px-4 text-[12px]"
            >
              Buka kuis pertama
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          )}
        </section>
      )}

      {dataSiap && ringkasan && ringkasan.butuhSesi === 0 && (
        <>
          {menunggu.length > 0 && (
            <section aria-labelledby="judul-menunggu" className="flex flex-col gap-3">
              <div>
                <h2 id="judul-menunggu" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
                  Menunggu keputusan guru
                </h2>
                <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
                  Siswa setengah paham. Masukkan ke daftar pendampingan atau lanjut evaluasi.
                </p>
              </div>
              <TabelPendampingan
                data={menunggu}
                jenis="menunggu"
                onTindakan={(id, tindakan) => void ubahTindakan(id, tindakan)}
                menyimpan={menyimpan}
                nonaktif={nonaktif}
              />
            </section>
          )}

          {pendampingan.length > 0 && (
            <section aria-labelledby="judul-pendampingan" className="flex flex-col gap-3">
              <div>
                <h2 id="judul-pendampingan" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
                  Perlu pendampingan
                </h2>
                <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
                  Siswa belum paham atau belum mengerjakan {JUMLAH_KUIS} kuis selesai terakhir.
                </p>
              </div>
              <TabelPendampingan
                data={pendampingan}
                jenis="pendampingan"
                onTindakan={(id, tindakan) => void ubahTindakan(id, tindakan)}
                menyimpan={menyimpan}
                nonaktif={nonaktif}
              />
            </section>
          )}

          {evaluasi.length > 0 && (
            <section aria-labelledby="judul-evaluasi" className="flex flex-col gap-3">
              <div>
                <h2 id="judul-evaluasi" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
                  Hasil kuis & evaluasi berikutnya
                </h2>
                <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
                  Siswa yang tidak perlu pendampingan atau sudah menyelesaikan pendampingan.
                </p>
              </div>
              <TabelPendampingan
                data={evaluasi}
                jenis="evaluasi"
                onTindakan={(id, tindakan) => void ubahTindakan(id, tindakan)}
                menyimpan={menyimpan}
                nonaktif={nonaktif}
              />
            </section>
          )}

          {paham.length > 0 && (
            <section aria-labelledby="judul-paham" className="aura-glass rounded-[24px] p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="judul-paham" className="font-display text-[18px] leading-[26px] font-bold text-aura-ink">
                  Paham
                </h2>
                <span className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">
                  {paham.length} siswa
                </span>
              </div>
              <p className="mt-1 font-body text-[13px] leading-[20px] text-aura-muted">
                Rata-rata ≥{BATAS_PAHAM}%. Tidak perlu pendampingan.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-display text-[12px] font-semibold text-aura-primary hover:underline">
                  Lihat nama siswa
                </summary>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {paham.map((s) => (
                    <li key={s.siswaId} className="font-body text-[13px] leading-[20px] text-aura-ink">
                      {s.nama}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          )}

          {menunggu.length === 0 && pendampingan.length === 0 && evaluasi.length === 0 && paham.length === 0 && (
            <p className="aura-glass rounded-[24px] px-5 py-6 font-body text-[13px] leading-[20px] text-aura-muted">
              Belum ada siswa di kelas ini.
            </p>
          )}
        </>
      )}
    </div>
  );
}
