"use client";

import { useEffect, useState } from "react";
import { DaftarKemajuan } from "@/components/DaftarKemajuan";
import { LabelHanyaGuru } from "@/components/LabelHanyaGuru";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabelPendampingan } from "@/components/TabelPendampingan";
import { ambilPendampingan } from "@/lib/api-klien";
import type { DataPendampingan } from "@/lib/tipe";

type Muatan = { status: "memuat" } | { status: "gagal"; pesan: string } | { status: "siap"; data: DataPendampingan };

// PRD F-8, design.md 3.5.
export default function HalamanPendampingan() {
  const [percobaan, setPercobaan] = useState(0);
  const [muatan, setMuatan] = useState<Muatan>({ status: "memuat" });

  useEffect(() => {
    const pengendali = new AbortController();
    ambilPendampingan(pengendali.signal)
      .then((data) => setMuatan({ status: "siap", data }))
      .catch((err: unknown) => {
        if (pengendali.signal.aborted) return;
        setMuatan({ status: "gagal", pesan: err instanceof Error ? err.message : "Data belum berhasil dimuat." });
      });
    return () => pengendali.abort();
  }, [percobaan]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] leading-tight font-bold">Perlu pendampingan</h1>
        <LabelHanyaGuru />
      </header>

      {muatan.status === "memuat" && <StatusHalaman jenis="memuat" judul="Memuat daftar pendampingan" />}
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
