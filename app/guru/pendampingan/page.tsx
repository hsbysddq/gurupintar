"use client";

import { Suspense, useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DaftarKemajuan } from "@/components/DaftarKemajuan";
import { LabelHanyaGuru } from "@/components/LabelHanyaGuru";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabelPendampingan } from "@/components/TabelPendampingan";
import { ambilDaftarKelas, ambilPendampingan } from "@/lib/api-klien";
import type { DataPendampingan, KelasRingkas } from "@/lib/tipe";

type Muatan = { status: "memuat" } | { status: "gagal"; pesan: string } | { status: "siap"; data: DataPendampingan };

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
  const [kelasId, setKelasId] = useState(kelasDariUrl);

  useEffect(() => {
    let batal = false;
    ambilDaftarKelas()
      .then((daftar) => {
        if (batal) return;
        setDaftarKelas(daftar);
        setKelasId((lama) => (lama && daftar.some((k) => k.id === lama) ? lama : (daftar[0]?.id ?? "")));
      })
      .catch(() => {
        if (!batal) setDaftarKelas([]);
      });
    return () => {
      batal = true;
    };
  }, []);

  // Sidebar bisa mengubah ?kelas= tanpa memuat ulang halaman.
  useEffect(() => {
    if (!kelasDariUrl || !daftarKelas) return;
    if (!daftarKelas.some((k) => k.id === kelasDariUrl)) return;
    setMuatan({ status: "memuat" });
    setKelasId(kelasDariUrl);
  }, [kelasDariUrl, daftarKelas]);

  useEffect(() => {
    if (!kelasId) return;
    const pengendali = new AbortController();
    ambilPendampingan(kelasId, pengendali.signal)
      .then((data) => setMuatan({ status: "siap", data }))
      .catch((err: unknown) => {
        if (pengendali.signal.aborted) return;
        setMuatan({ status: "gagal", pesan: err instanceof Error ? err.message : "Data belum berhasil dimuat." });
      });
    return () => pengendali.abort();
  }, [percobaan, kelasId]);

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
                  setKelasId(id);
                  router.replace(`/guru/pendampingan?kelas=${encodeURIComponent(id)}`);
                }}
                className="h-10 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-[15px] text-tinta"
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
      {(!daftarKelas || daftarKelas.length > 0) && muatan.status === "memuat" && (
        <StatusHalaman jenis="memuat" judul="Memuat daftar pendampingan" />
      )}
      {muatan.status === "gagal" && (
        <StatusHalaman
          jenis="gagal"
          judul="Daftar pendampingan belum berhasil dimuat"
          pesan={muatan.pesan}
          aksi={{
            label: "Coba lagi",
            onClick: () => {
              setMuatan({ status: "memuat" });
              setPercobaan((p) => p + 1);
            },
          }}
        />
      )}
      {muatan.status === "siap" && (
        <>
          <section aria-labelledby="judul-pendampingan" className="flex flex-col gap-3">
            <h2 id="judul-pendampingan" className="sr-only">
              Daftar perlu pendampingan
            </h2>
            <TabelPendampingan data={muatan.data.perluPendampingan} />
          </section>
          <section aria-labelledby="judul-kemajuan" className="flex flex-col gap-3">
            <h2 id="judul-kemajuan" className="text-xl leading-snug font-semibold">
              Mengalami kemajuan
            </h2>
            <DaftarKemajuan data={muatan.data.kemajuan} />
          </section>
        </>
      )}
    </div>
  );
}
