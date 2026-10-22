"use client";

import { useId, useState } from "react";
import { FileText, FileUp, Presentation, Sparkles } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { StatusHalaman } from "@/components/StatusHalaman";
import { TabMateriSiswa } from "@/components/TabMateriSiswa";
import { Tombol } from "@/components/Tombol";
import { ubahModul, ubahModulPdf } from "@/lib/api-klien";
import { PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN, UKURAN_PDF_MAKS_BYTE } from "@/lib/konstanta";
import { unduhDocx, unduhPptx } from "@/lib/unduh-materi";
import type { IsiMateri } from "@/lib/tipe";

type Keadaan =
  | { status: "diam" }
  | { status: "memuat" }
  | { status: "gagal"; pesan: string }
  | { status: "siap"; isi: IsiMateri; nomor: number };

type Sumber = "teks" | "pdf";

function bacaSebagaiBase64(file: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result).split(",")[1] ?? "");
    pembaca.onerror = () => gagal(new Error("File belum bisa dibaca. Coba pilih file lagi."));
    pembaca.readAsDataURL(file);
  });
}

// PRD F-9, design.md 3.8. Hasil hanya pratinjau dan tidak disimpan.
export default function HalamanUbahModul() {
  const idDasar = useId();
  const [teks, setTeks] = useState("");
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "diam" });
  const [nomor, setNomor] = useState(0);
  const [sumber, setSumber] = useState<Sumber>("teks");
  const [berkas, setBerkas] = useState<File | null>(null);
  const [galatBerkas, setGalatBerkas] = useState<string | null>(null);
  const [mengunduh, setMengunduh] = useState<"pptx" | "docx" | null>(null);

  // Dihitung setelah spasi di awal dan akhir dibuang, sama dengan skema di server.
  const panjang = teks.trim().length;
  const panjangSesuai = panjang >= PANJANG_MODUL_MIN && panjang <= PANJANG_MODUL_MAKS;
  const memuat = keadaan.status === "memuat";
  const siapKirim = sumber === "teks" ? panjangSesuai : berkas !== null;

  function pilihBerkas(file: File | null) {
    setGalatBerkas(null);
    if (!file) return setBerkas(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setBerkas(null);
      return setGalatBerkas("File harus berupa PDF.");
    }
    if (file.size > UKURAN_PDF_MAKS_BYTE) {
      setBerkas(null);
      return setGalatBerkas("Ukuran PDF maksimal 5 MB.");
    }
    setBerkas(file);
  }

  async function unduh(jenis: "pptx" | "docx", isi: IsiMateri) {
    setMengunduh(jenis);
    try {
      await (jenis === "pptx" ? unduhPptx(isi) : unduhDocx(isi));
    } finally {
      setMengunduh(null);
    }
  }

  async function ubah() {
    if (!siapKirim || memuat) return;
    setKeadaan({ status: "memuat" });
    try {
      const { isi } = sumber === "teks" ? await ubahModul(teks) : await ubahModulPdf(await bacaSebagaiBase64(berkas!));
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
          Tempelkan teks atau unggah PDF modul matematika kelas 7, lalu ubah menjadi video, audio, bacaan, dan latihan.
        </p>
      </header>

      <KartuKaca className="flex flex-col gap-3 p-6">
        <div role="tablist" aria-label="Sumber modul" className="flex flex-wrap gap-2">
          {([
            ["teks", "Tempel teks", FileText],
            ["pdf", "Unggah PDF", FileUp],
          ] as const).map(([nilai, label, Ikon]) => (
            <button
              key={nilai}
              type="button"
              role="tab"
              aria-selected={sumber === nilai}
              onClick={() => setSumber(nilai)}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors ${
                sumber === nilai ? "bg-primer text-white" : "bg-white/70 text-tinta-lembut hover:bg-primer-lembut"
              }`}
            >
              <Ikon aria-hidden="true" className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {sumber === "teks" ? (
          <>
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
          </>
        ) : (
          <>
            <label htmlFor={`${idDasar}-pdf`} className="text-[15px] font-semibold">
              File modul (PDF)
            </label>
            <input
              id={`${idDasar}-pdf`}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => pilihBerkas(e.target.files?.[0] ?? null)}
              className="w-full min-w-0 rounded-kecil border border-dashed border-tinta/25 bg-white/80 px-3 py-6 text-base text-tinta"
            />
            <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Hanya PDF, maksimal 5 MB. Jangan unggah file yang berisi nama siswa atau data pribadi.
            </p>
            {galatBerkas && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galatBerkas}</p>}
          </>
        )}
        <div>
          <Tombol varian="utama" ikon={Sparkles} memuat={memuat} disabled={!siapKirim} onClick={() => void ubah()}>
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
          <div className="flex flex-wrap gap-2">
            <Tombol varian="sekunder" ikon={Presentation} memuat={mengunduh === "pptx"} onClick={() => void unduh("pptx", keadaan.isi)}>
              Unduh PPT
            </Tombol>
            <Tombol varian="sekunder" ikon={FileText} memuat={mengunduh === "docx"} onClick={() => void unduh("docx", keadaan.isi)}>
              Unduh dokumen (Word)
            </Tombol>
          </div>
          <TabMateriSiswa key={keadaan.nomor} isi={keadaan.isi} formatAwal={null} />
        </section>
      )}
    </div>
  );
}
