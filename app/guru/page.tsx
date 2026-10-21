"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { PanelKodeKelas } from "@/components/PanelKodeKelas";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { usePolling } from "@/hooks/use-polling";
import {
  ambilDaftarKelas,
  ambilDaftarSesi,
  ambilDaftarTopik,
  buatKelas,
  bukaSesi,
  ErrorApi,
  tutupSesi,
} from "@/lib/api-klien";
import { INTERVAL_POLLING_GURU_MS, TOPIK_DEMO_ID } from "@/lib/konstanta";
import type { KelasRingkas, TopikRingkas } from "@/lib/tipe";

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function pesanGalat(err: unknown): string {
  return err instanceof ErrorApi ? err.message : "Terjadi kesalahan. Coba lagi sebentar.";
}

// PRD F-4: daftar sesi kelas milik guru, buka kuis baru, dan panel kode untuk kuis yang aktif.
export default function HalamanDashboardGuru() {
  const [daftarKelas, setDaftarKelas] = useState<KelasRingkas[] | null>(null);
  const [galatKelas, setGalatKelas] = useState(false);
  const [percobaanKelas, setPercobaanKelas] = useState(0);
  const [kelasId, setKelasId] = useState("");

  const ambilSesi = useCallback(
    (signal: AbortSignal) => ambilDaftarSesi(kelasId || undefined, signal),
    [kelasId],
  );
  const { data: daftar, galat, memuat, muatUlang } = usePolling(
    kelasId ? ambilSesi : null,
    INTERVAL_POLLING_GURU_MS,
  );

  const [membuka, setMembuka] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);
  const idPilihTopik = useId();
  const idPilihKelas = useId();
  const [daftarTopik, setDaftarTopik] = useState<TopikRingkas[] | null>(null);
  const [galatTopik, setGalatTopik] = useState(false);
  const [topikId, setTopikId] = useState(TOPIK_DEMO_ID);

  const [namaKelasBaru, setNamaKelasBaru] = useState("");
  const [mapelBaru, setMapelBaru] = useState("");
  const [membuatKelas, setMembuatKelas] = useState(false);

  useEffect(() => {
    let batal = false;
    ambilDaftarKelas()
      .then((daftar) => {
        if (batal) return;
        setDaftarKelas(daftar);
        setGalatKelas(false);
        setKelasId((lama) => (lama && daftar.some((k) => k.id === lama) ? lama : (daftar[0]?.id ?? "")));
      })
      .catch(() => {
        if (!batal) setGalatKelas(true);
      });
    return () => {
      batal = true;
    };
  }, [percobaanKelas]);

  useEffect(() => {
    let batal = false;
    ambilDaftarTopik()
      .then((daftar) => {
        if (!batal) setDaftarTopik(daftar);
      })
      .catch(() => {
        if (!batal) setGalatTopik(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  const kelas = daftarKelas?.find((k) => k.id === kelasId) ?? null;
  const sesiAktif = daftar?.find((s) => s.status === "aktif");

  async function bukaKuisBaru() {
    if (!kelasId) return;
    setMembuka(true);
    setGalatAksi(null);
    try {
      await bukaSesi({ kelasId, topikId });
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

  async function tambahKelas() {
    setMembuatKelas(true);
    setGalatAksi(null);
    try {
      const baru = await buatKelas({ nama: namaKelasBaru, mapel: mapelBaru });
      setNamaKelasBaru("");
      setMapelBaru("");
      setPercobaanKelas((n) => n + 1);
      setKelasId(baru.id);
    } catch (err) {
      setGalatAksi(pesanGalat(err));
    } finally {
      setMembuatKelas(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight font-bold">{kelas?.nama ?? "Kelas saya"}</h1>
          <p className="text-tinta-lembut">
            {kelas ? `${kelas.mapel} · ${kelas.jumlahSiswa} siswa · Kode undangan ${kelas.kodeUndangan}` : "Pilih atau buat kelas"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor={idPilihKelas} className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Kelas
            </label>
            <select
              id={idPilihKelas}
              value={kelasId}
              disabled={!daftarKelas || daftarKelas.length === 0 || membuka}
              onChange={(e) => setKelasId(e.target.value)}
              className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta disabled:opacity-60"
            >
              {daftarKelas && daftarKelas.length > 0 ? (
                daftarKelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))
              ) : (
                <option value="">{galatKelas ? "Gagal memuat kelas" : "Memuat kelas…"}</option>
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={idPilihTopik} className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Topik kuis
            </label>
            <select
              id={idPilihTopik}
              value={topikId}
              disabled={!daftarTopik || membuka}
              onChange={(e) => setTopikId(e.target.value)}
              className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta disabled:opacity-60"
            >
              {daftarTopik ? (
                daftarTopik.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))
              ) : (
                <option value={TOPIK_DEMO_ID}>{galatTopik ? "Pecahan Senilai" : "Memuat topik…"}</option>
              )}
            </select>
          </div>
          <Tombol varian="utama" ikon={Plus} memuat={membuka} disabled={!kelasId} onClick={bukaKuisBaru}>
            Buka kuis baru
          </Tombol>
        </div>
      </header>

      {galatTopik && (
        <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
          Daftar topik belum berhasil dimuat. Kuis baru memakai topik Pecahan Senilai.
        </p>
      )}

      {galatKelas && (
        <p role="alert" className="text-belum-teks">
          Daftar kelas belum berhasil dimuat.{" "}
          <button type="button" className="font-semibold underline" onClick={() => setPercobaanKelas((n) => n + 1)}>
            Coba lagi
          </button>
        </p>
      )}

      {galatAksi && (
        <p role="alert" className="font-medium text-belum-teks">
          {galatAksi}
        </p>
      )}

      {daftarKelas && daftarKelas.length === 0 && (
        <KartuKaca as="section" className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-xl leading-snug font-semibold">Buat kelas pertamamu</h2>
            <p className="text-tinta-lembut">Siswa memakai kode undangan kelas untuk mendaftar.</p>
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void tambahKelas();
            }}
          >
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="nama-kelas-baru" className="text-[13px] leading-normal font-medium text-tinta-lembut">
                Nama kelas
              </label>
              <input
                id="nama-kelas-baru"
                value={namaKelasBaru}
                onChange={(e) => setNamaKelasBaru(e.target.value)}
                placeholder="Kelas 7A"
                required
                className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="mapel-baru" className="text-[13px] leading-normal font-medium text-tinta-lembut">
                Mata pelajaran
              </label>
              <input
                id="mapel-baru"
                value={mapelBaru}
                onChange={(e) => setMapelBaru(e.target.value)}
                placeholder="Matematika"
                required
                className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta"
              />
            </div>
            <Tombol
              varian="utama"
              type="submit"
              memuat={membuatKelas}
              disabled={!namaKelasBaru || !mapelBaru}
            >
              Buat kelas
            </Tombol>
          </form>
        </KartuKaca>
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
        {!kelasId ? (
          <StatusHalaman jenis="kosong" judul="Belum ada kelas" pesan="Buat kelas dulu untuk membuka kuis." />
        ) : memuat ? (
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
