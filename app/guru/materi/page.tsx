"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Send, Sparkles } from "lucide-react";
import { GagalBuatMateri } from "@/components/GagalBuatMateri";
import { KartuKaca } from "@/components/KartuKaca";
import { KartuMateriGuru } from "@/components/KartuMateriGuru";
import { KepalaKelasDariId } from "@/components/KepalaKelasDariId";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { useBuatMateri } from "@/hooks/use-buat-materi";
import { ambilHasil, ambilMateriGuru, bagikanMateri, ubahMateri } from "@/lib/api-klien";
import type { IsiMateri, MateriGuru } from "@/lib/tipe";

type Muatan = { status: "memuat" } | { status: "gagal"; pesan: string } | { status: "siap"; materi: MateriGuru[] };

type Pembagian = { status: "diam" } | { status: "mengirim" } | { status: "selesai" } | { status: "gagal"; pesan: string };

export default function HalamanMateri() {
  return (
    <Suspense fallback={<StatusHalaman jenis="memuat" judul="Memuat materi" />}>
      <MateriLanjutan />
    </Suspense>
  );
}

// PRD F-6: guru meninjau, mengubah, dan membagikan materi (design.md 3.4).
function MateriLanjutan() {
  const router = useRouter();
  const params = useSearchParams();
  const sesiId = params.get("sesi");
  const kelasId = params.get("kelas");
  const [percobaan, setPercobaan] = useState(0);
  const [muatan, setMuatan] = useState<Muatan>({ status: "memuat" });
  const [konfirmasiGanti, setKonfirmasiGanti] = useState(false);
  const [pembagian, setPembagian] = useState<Pembagian>({ status: "diam" });
  // Tombol cadangan hanya untuk topik demo (PRD F-10). Jika gagal dibaca, tombol disembunyikan; API tetap menolak.
  const [cadanganTersedia, setCadanganTersedia] = useState(false);

  useEffect(() => {
    if (!sesiId) return;
    let batal = false;
    ambilHasil(sesiId)
      .then((h) => {
        if (!batal) setCadanganTersedia(h.sesi.cadanganTersedia);
      })
      .catch(() => {
        if (!batal) setCadanganTersedia(false);
      });
    return () => {
      batal = true;
    };
  }, [sesiId]);

  useEffect(() => {
    if (!sesiId) return;
    let batal = false;
    ambilMateriGuru(sesiId)
      .then((materi) => {
        if (!batal) setMuatan({ status: "siap", materi });
      })
      .catch((err: unknown) => {
        if (!batal) setMuatan({ status: "gagal", pesan: err instanceof Error ? err.message : "Materi belum berhasil dimuat." });
      });
    return () => {
      batal = true;
    };
  }, [sesiId, percobaan]);

  const setelahDibuat = useCallback((materi: MateriGuru[]) => {
    setMuatan({ status: "siap", materi });
    setPembagian({ status: "diam" });
  }, []);
  const pembuat = useBuatMateri(sesiId, setelahDibuat);

  const simpan = useCallback(async (id: string, isi: IsiMateri, versi: number) => {
    const hasil = await ubahMateri(id, versi, isi);
    setMuatan((m) =>
      m.status === "siap" ? { ...m, materi: m.materi.map((x) => (x.id === id ? { ...x, isi, versi: hasil.versi } : x)) } : m,
    );
  }, []);

  async function bagikan() {
    if (!sesiId || pembagian.status === "mengirim") return;
    setPembagian({ status: "mengirim" });
    try {
      await bagikanMateri(sesiId);
      setMuatan((m) =>
        m.status === "siap" ? { ...m, materi: m.materi.map((x) => ({ ...x, status: "dibagikan" as const })) } : m,
      );
      setPembagian({ status: "selesai" });
    } catch (err) {
      setPembagian({ status: "gagal", pesan: err instanceof Error ? err.message : "Materi belum berhasil dibagikan." });
    }
  }

  if (!sesiId) {
    return (
      <StatusHalaman
        jenis="kosong"
        judul="Pilih kuis terlebih dulu"
        pesan="Buka materi dari halaman hasil kuis."
        aksi={{ label: "Ke dashboard", onClick: () => router.push("/guru") }}
      />
    );
  }
  if (muatan.status === "memuat") return <StatusHalaman jenis="memuat" judul="Memuat materi" />;
  if (muatan.status === "gagal") {
    return (
      <StatusHalaman
        jenis="gagal"
        judul="Materi belum berhasil dimuat"
        pesan={muatan.pesan}
        aksi={{
          label: "Coba lagi",
          onClick: () => {
            setMuatan({ status: "memuat" });
            setPercobaan((p) => p + 1);
          },
        }}
      />
    );
  }

  const { materi } = muatan;
  const { keadaan, menyusun } = pembuat;
  const gagalAi = keadaan.status === "gagal-ai";
  const adaDibagikan = materi.some((m) => m.status === "dibagikan");
  const adaDraf = materi.some((m) => m.status === "draf");
  const kembali = `/guru/hasil?sesi=${encodeURIComponent(sesiId)}${kelasId ? `&kelas=${encodeURIComponent(kelasId)}` : ""}`;

  const statusProses = (
    <div aria-live="polite" className="flex flex-col gap-1">
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
      {pembagian.status === "selesai" && <p className="font-semibold text-sudah-teks">Materi sudah dibagikan.</p>}
      {pembagian.status === "gagal" && (
        <p role="alert" className="font-medium text-belum-teks">
          {pembagian.pesan}
        </p>
      )}
    </div>
  );

  const panelGagal = gagalAi && (
    <GagalBuatMateri
      sibuk={menyusun}
      onCobaLagi={pembuat.cobaLagi}
      onGunakanCadangan={cadanganTersedia ? pembuat.gunakanCadangan : undefined}
      onBatal={materi.length > 0 ? pembuat.batal : undefined}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <KepalaKelasDariId kelasId={kelasId} />

      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">Materi lanjutan</h1>
        <p className="text-base leading-snug font-semibold">Periksa dan sesuaikan materi sebelum dibagikan.</p>
      </header>

      {statusProses}

      {materi.length === 0 ? (
        panelGagal || (
          <KartuKaca className="flex flex-col items-start gap-3 p-6">
            <h2 className="text-xl leading-snug font-semibold">Belum ada materi untuk kuis ini</h2>
            <p className="text-tinta-lembut">Buat materi lanjutan untuk setiap kelompok yang sudah menjawab.</p>
            <Tombol varian="utama" memuat={menyusun} onClick={() => void pembuat.buat()}>
              Buat materi
            </Tombol>
          </KartuKaca>
        )
      ) : (
        <>
          {panelGagal}
          <div className="grid gap-4 lg:grid-cols-3">
            {materi.map((m) => (
              <KartuMateriGuru key={m.id} materi={m} onSimpan={(isi, versi) => simpan(m.id, isi, versi)} />
            ))}
          </div>

          {konfirmasiGanti && (
            <KartuKaca varian="pekat" className="flex flex-col gap-3 p-4">
              <p role="alert" className="font-semibold">
                Materi draf akan diganti.
              </p>
              <div className="flex flex-wrap gap-3">
                <Tombol
                  varian="sekunder"
                  onClick={() => {
                    setKonfirmasiGanti(false);
                    void pembuat.buat({ ganti: true });
                  }}
                >
                  Ganti materi
                </Tombol>
                <Tombol varian="teks" onClick={() => setKonfirmasiGanti(false)}>
                  Batal
                </Tombol>
              </div>
            </KartuKaca>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Tombol
                varian="sekunder"
                ikon={RefreshCw}
                memuat={menyusun}
                disabled={adaDibagikan || konfirmasiGanti || gagalAi}
                onClick={() => setKonfirmasiGanti(true)}
              >
                Buat ulang
              </Tombol>
              {adaDibagikan && (
                <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
                  Materi yang sudah dibagikan tidak bisa dibuat ulang.
                </p>
              )}
            </div>
            {!gagalAi && (
              <Tombol
                varian="utama"
                ikon={Send}
                memuat={pembagian.status === "mengirim"}
                disabled={!adaDraf || menyusun}
                onClick={() => void bagikan()}
              >
                Bagikan ke Siswa
              </Tombol>
            )}
          </div>
        </>
      )}

      <div>
        <Tombol varian="teks" href={kembali}>
          Kembali ke hasil kuis
        </Tombol>
      </div>
    </div>
  );
}
