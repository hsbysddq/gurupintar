"use client";

import { Suspense, useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DaftarKemajuan } from "@/components/DaftarKemajuan";
import { LabelHanyaGuru } from "@/components/LabelHanyaGuru";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabelPendampingan } from "@/components/TabelPendampingan";
import { ambilDaftarKelas, ambilPendampingan } from "@/lib/api-klien";
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] leading-tight font-bold">Perlu pendampingan</h1>
        <div className="flex flex-wrap items-center gap-3">
          {daftarKelas && daftarKelas.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor={idKelas} className="text-[13px] leading-normal font-medium text-tinta-lembut">
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
                className="h-11 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta sm:text-[15px]"
              >
                {daftarKelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
          <LabelHanyaGuru />
        </div>
      </header>

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
            <h2 id="judul-kemajuan" className="text-xl leading-snug font-semibold">
              Mengalami kemajuan
            </h2>
            <DaftarKemajuan data={dataSiap.kemajuan} />
          </section>
        </>
      )}
    </div>
  );
}
