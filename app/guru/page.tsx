"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { PanelKodeKelas } from "@/components/PanelKodeKelas";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { usePolling } from "@/hooks/use-polling";
import { ambilDaftarSesi, bukaSesi, ErrorApi, tutupSesi } from "@/lib/api-klien";
import { INTERVAL_POLLING_GURU_MS } from "@/lib/konstanta";

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function pesanGalat(err: unknown): string {
  return err instanceof ErrorApi ? err.message : "Terjadi kesalahan. Coba lagi sebentar.";
}

// PRD F-4: daftar sesi Kelas 7A, buka kuis baru, dan panel kode untuk kuis yang aktif.
export default function HalamanDashboardGuru() {
  const { data: daftar, galat, memuat, muatUlang } = usePolling(ambilDaftarSesi, INTERVAL_POLLING_GURU_MS);
  const [membuka, setMembuka] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

  const sesiAktif = daftar?.find((s) => s.status === "aktif");

  async function bukaKuisBaru() {
    setMembuka(true);
    setGalatAksi(null);
    try {
      await bukaSesi();
      muatUlang();
    } catch (err) {
      setGalatAksi(pesanGalat(err));
    } finally {
      setMembuka(false);
    }
  }

  async function tutupKuis(sesiId: string) {
    setMenutup(true);
    setGalatAksi(null);
    try {
      await tutupSesi(sesiId);
      muatUlang();
    } catch (err) {
      setGalatAksi(pesanGalat(err));
    } finally {
      setMenutup(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight font-bold">Kelas 7A</h1>
          <p className="text-tinta-lembut">Matematika, Bu Rina</p>
        </div>
        <Tombol varian="utama" ikon={Plus} memuat={membuka} onClick={bukaKuisBaru}>
          Buka kuis baru
        </Tombol>
      </header>

      {galatAksi && (
        <p role="alert" className="font-medium text-belum-teks">
          {galatAksi}
        </p>
      )}

      {sesiAktif && (
        <PanelKodeKelas
          kodeKelas={sesiAktif.kodeKelas}
          urlGabung={`${window.location.origin}/siswa?kode=${sesiAktif.kodeKelas}`}
          urlHasil={`/guru/hasil?sesi=${sesiAktif.id}`}
          onTutup={() => tutupKuis(sesiAktif.id)}
          sedangMenutup={menutup}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl leading-snug font-semibold">Riwayat kuis</h2>
        {memuat ? (
          <StatusHalaman jenis="memuat" judul="Memuat riwayat kuis" />
        ) : !daftar ? (
          <StatusHalaman
            jenis="gagal"
            judul="Riwayat kuis belum berhasil dimuat"
            pesan={galat ?? undefined}
            aksi={{ label: "Coba lagi", onClick: muatUlang }}
          />
        ) : daftar.length === 0 ? (
          <StatusHalaman jenis="kosong" judul="Belum ada kuis" pesan="Tekan Buka kuis baru untuk memulai cek pemahaman." />
        ) : (
          <KartuKaca as="div" className="p-2">
            <ul className="flex flex-col">
              {daftar.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/guru/hasil?sesi=${s.id}`}
                    className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-kecil px-4 py-3 transition-colors hover:bg-primer-lembut"
                  >
                    <span className="font-semibold">{FORMAT_TANGGAL.format(new Date(s.dibuatPada))}</span>
                    <span className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[13px] leading-normal font-medium ${
                          s.status === "aktif" ? "bg-primer-lembut text-primer" : "bg-tinta/5 text-tinta-lembut"
                        }`}
                      >
                        {s.status === "aktif" ? "Aktif" : "Selesai"}
                      </span>
                      <span className="text-tinta-lembut">{s.jumlahMenjawab} menjawab</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </KartuKaca>
        )}
      </section>
    </div>
  );
}
