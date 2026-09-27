"use client";

import { useId, useState } from "react";
import { Sparkles } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabMateriSiswa } from "@/components/TabMateriSiswa";
import { Tombol } from "@/components/Tombol";
import { ubahModul } from "@/lib/api-klien";
import { PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN } from "@/lib/konstanta";
import type { IsiMateri } from "@/lib/tipe";

type Keadaan =
  | { status: "diam" }
  | { status: "memuat" }
  | { status: "gagal"; pesan: string }
  | { status: "siap"; isi: IsiMateri; nomor: number };

// PRD F-9, design.md 3.8. Hasil hanya pratinjau dan tidak disimpan.
export default function HalamanUbahModul() {
  const idDasar = useId();
  const [teks, setTeks] = useState("");
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "diam" });
  const [nomor, setNomor] = useState(0);

  // Dihitung setelah spasi di awal dan akhir dibuang, sama dengan skema di server.
  const panjang = teks.trim().length;
  const panjangSesuai = panjang >= PANJANG_MODUL_MIN && panjang <= PANJANG_MODUL_MAKS;
  const memuat = keadaan.status === "memuat";

  async function ubah() {
    if (!panjangSesuai || memuat) return;
    setKeadaan({ status: "memuat" });
    try {
      const { isi } = await ubahModul(teks);
      // Nomor baru memasang ulang pratinjau agar tab dan jawaban latihan kembali ke awal.
      const berikut = nomor + 1;
      setNomor(berikut);
      setKeadaan({ status: "siap", isi, nomor: berikut });
    } catch (err) {
      setKeadaan({ status: "gagal", pesan: err instanceof Error ? err.message : "Materi belum berhasil dibuat." });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight font-bold">Ubah modul</h1>
        <p className="text-base leading-snug font-semibold">
          Tempelkan teks modul matematika kelas 7, lalu ubah menjadi video, audio, bacaan, dan latihan.
        </p>
      </header>

      <KartuKaca className="flex flex-col gap-3 p-6">
        <label htmlFor={`${idDasar}-teks`} className="text-[15px] font-semibold">
          Teks modul
        </label>
        <textarea
          id={`${idDasar}-teks`}
          rows={12}
          aria-describedby={`${idDasar}-bantuan ${idDasar}-hitung`}
          className="w-full rounded-kecil border border-tinta/15 bg-white/80 px-3 py-2 text-base leading-relaxed text-tinta"
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
        />
        <div className="flex flex-wrap items-start justify-between gap-2 text-[13px] leading-normal font-medium">
          <p id={`${idDasar}-bantuan`} className="text-tinta-lembut">
            Jangan tempelkan nama siswa atau data pribadi. Panjang teks {PANJANG_MODUL_MIN}–{PANJANG_MODUL_MAKS} karakter.
          </p>
          <p
            id={`${idDasar}-hitung`}
            aria-live="polite"
            className={panjangSesuai || panjang === 0 ? "text-tinta-lembut" : "text-belum-teks"}
          >
            {panjang} / {PANJANG_MODUL_MAKS} karakter
          </p>
        </div>
        <div>
          <Tombol varian="utama" ikon={Sparkles} memuat={memuat} disabled={!panjangSesuai} onClick={() => void ubah()}>
            Ubah jadi 4 bentuk belajar
          </Tombol>
        </div>
      </KartuKaca>

      {keadaan.status === "memuat" && <StatusHalaman jenis="memuat" judul="Menyusun materi dari modul" />}
      {keadaan.status === "gagal" && (
        <StatusHalaman
          jenis="gagal"
          judul="Materi belum berhasil dibuat"
          pesan={keadaan.pesan}
          aksi={{ label: "Coba lagi", onClick: () => void ubah() }}
        />
      )}
      {keadaan.status === "siap" && (
        <section aria-labelledby={`${idDasar}-pratinjau`} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id={`${idDasar}-pratinjau`} className="text-xl leading-snug font-semibold">
              Pratinjau
            </h2>
            <p className="text-tinta-lembut">Hasil ini tidak disimpan. Periksa isinya sebelum dipakai di kelas.</p>
          </div>
          <TabMateriSiswa key={keadaan.nomor} isi={keadaan.isi} formatAwal={null} />
        </section>
      )}
    </div>
  );
}
