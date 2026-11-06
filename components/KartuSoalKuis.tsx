import Image from "next/image";
import { Check } from "lucide-react";
import { GambarSoal } from "@/components/GambarSoal";
import { KartuKaca } from "@/components/KartuKaca";
import {
  adalahPilihanMenjodohkan,
  ambilDaftarPilihan,
  formatJawabanMenjodohkan,
  LABEL_TIPE_SOAL,
  normalisasiPilganKompleks,
  PETUNJUK_TIPE_SOAL,
  uraiBenarSalah,
  uraiJawabanMenjodohkan,
  uraiPilganKompleks,
} from "@/lib/soal-tka";
import type { DataPilihanSoal, TipeSoal } from "@/lib/tipe";

type KartuSoalKuisProps = {
  nomor?: number;
  tipe?: TipeSoal;
  teks: string;
  gambar?: string | null;
  pilihan: DataPilihanSoal;
  terpilih: string | null;
  onPilih: (nilai: string) => void;
};

export function KartuSoalKuis({
  nomor,
  tipe = "pilgan",
  teks,
  gambar,
  pilihan,
  terpilih,
  onPilih,
}: KartuSoalKuisProps) {
  const daftarPilihan = ambilDaftarPilihan(pilihan);
  const nilaiSaatIni = terpilih ?? "";

  return (
    <KartuKaca as="section" className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-aura-primary/10 px-2.5 py-0.5 font-display text-[11px] font-bold text-aura-primary">
            {LABEL_TIPE_SOAL[tipe]}
          </span>
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.06em] text-aura-muted">
            {PETUNJUK_TIPE_SOAL[tipe]}
          </span>
        </div>
        <h2 id="teks-soal" className="mt-1 font-display text-[21px] leading-snug font-bold text-aura-ink sm:text-2xl">
          {teks}
        </h2>
      </div>

      {gambar && <GambarSoal src={gambar} alt={nomor ? `Gambar soal ${nomor}` : "Gambar soal"} />}

      {/* 1. PILIHAN GANDA BIASA */}
      {tipe === "pilgan" && (
        <div role="radiogroup" aria-labelledby="teks-soal" className="flex flex-col gap-3">
          {daftarPilihan.map((p) => {
            const dipilih = nilaiSaatIni === p.kode;
            return (
              <button
                key={p.kode}
                type="button"
                role="radio"
                aria-checked={dipilih}
                onClick={() => onPilih(p.kode)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                  dipilih
                    ? "border-aura-primary bg-aura-primary/10 text-aura-ink shadow-[0_8px_20px_-14px_rgba(37,99,235,0.45)]"
                    : "border-white/65 bg-white/55 text-aura-ink hover:border-aura-primary/25 hover:bg-aura-primary/5"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold ${
                    dipilih ? "bg-aura-primary text-white" : "bg-aura-primary/10 text-aura-primary"
                  }`}
                >
                  {p.kode}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span>{p.teks}</span>
                  {p.gambar && (
                    <Image
                      src={p.gambar}
                      alt={`Gambar pilihan ${p.kode}`}
                      width={320}
                      height={200}
                      unoptimized
                      className="max-h-28 w-auto max-w-full rounded-lg object-contain"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. PILIHAN GANDA KOMPLEKS (TKA) */}
      {tipe === "pilgan_kompleks" && (
        <div role="group" aria-labelledby="teks-soal" className="flex flex-col gap-3">
          {daftarPilihan.map((p) => {
            const kodeTercentang = uraiPilganKompleks(nilaiSaatIni);
            const dipilih = kodeTercentang.includes(p.kode as "A" | "B" | "C" | "D");
            return (
              <button
                key={p.kode}
                type="button"
                role="checkbox"
                aria-checked={dipilih}
                onClick={() => {
                  const baru = dipilih
                    ? kodeTercentang.filter((k) => k !== p.kode)
                    : [...kodeTercentang, p.kode];
                  onPilih(normalisasiPilganKompleks(baru));
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                  dipilih
                    ? "border-aura-primary bg-aura-primary/10 text-aura-ink shadow-[0_8px_20px_-14px_rgba(37,99,235,0.45)]"
                    : "border-white/65 bg-white/55 text-aura-ink hover:border-aura-primary/25 hover:bg-aura-primary/5"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl border font-display text-[13px] font-bold ${
                    dipilih
                      ? "border-aura-primary bg-aura-primary text-white"
                      : "border-aura-primary/30 bg-white text-aura-primary"
                  }`}
                >
                  {dipilih ? <Check aria-hidden="true" className="size-4" /> : p.kode}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span>{p.teks}</span>
                  {p.gambar && (
                    <Image
                      src={p.gambar}
                      alt={`Gambar pilihan ${p.kode}`}
                      width={320}
                      height={200}
                      unoptimized
                      className="max-h-28 w-auto max-w-full rounded-lg object-contain"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. BENAR / SALAH PER PERNYATAAN (TKA) */}
      {tipe === "benar_salah" && (
        <div className="flex flex-col gap-2.5">
          {daftarPilihan.map((p, idx) => {
            const statusBaris = uraiBenarSalah(nilaiSaatIni, daftarPilihan.length);
            const dipilihBS = statusBaris[idx];
            return (
              <div
                key={p.kode}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-aura-primary/10 font-display text-[11px] font-bold text-aura-primary">
                    {p.kode}
                  </span>
                  <span className="min-w-0 text-[15px] leading-snug text-aura-ink">{p.teks}</span>
                </div>
                <div
                  role="radiogroup"
                  aria-label={`Pernyataan ${p.kode}`}
                  className="grid shrink-0 grid-cols-2 gap-2 sm:flex"
                >
                  {(["B", "S"] as const).map((opsi) => {
                    const aktif = dipilihBS === opsi;
                    return (
                      <button
                        key={opsi}
                        type="button"
                        role="radio"
                        aria-checked={aktif}
                        onClick={() => {
                          const salinan = [...statusBaris];
                          salinan[idx] = opsi;
                          onPilih(salinan.join(","));
                        }}
                        className={`min-h-11 rounded-full px-4 font-display text-[13px] font-bold transition-all ${
                          aktif
                            ? "bg-aura-primary text-white shadow-sm"
                            : "border border-aura-primary/20 bg-white/80 text-aura-ink hover:bg-aura-primary/5"
                        }`}
                      >
                        {opsi === "B" ? "Benar" : "Salah"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. ISIAN SINGKAT (TKA) */}
      {tipe === "isian_singkat" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="input-isian-singkat" className="sr-only">
            Jawaban singkat
          </label>
          <input
            id="input-isian-singkat"
            type="text"
            maxLength={200}
            placeholder="Ketik jawabanmu di sini…"
            value={nilaiSaatIni}
            onChange={(e) => onPilih(e.target.value)}
            className="min-h-14 w-full rounded-2xl border border-aura-primary/25 bg-white/80 px-4 py-3 font-body text-lg font-medium text-aura-ink shadow-sm placeholder:text-aura-muted/55 focus:border-aura-primary focus:bg-white"
          />
          <p className="text-[12px] text-aura-muted">
            Tulis angka atau kata singkat yang tepat (huruf besar/kecil tidak dibedakan).
          </p>
        </div>
      )}

      {/* 5. MENJODOHKAN (TKA) */}
      {tipe === "menjodohkan" && adalahPilihanMenjodohkan(pilihan) && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-aura-primary/15 bg-aura-primary/5 p-3.5">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.05em] text-aura-muted">
              Pilihan pasangan
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {pilihan.kanan.map((kn) => (
                <li
                  key={kn.kode}
                  className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-[14px] text-aura-ink"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-aura-primary/15 font-display text-[11px] font-bold text-aura-primary">
                    {kn.kode}
                  </span>
                  <span className="min-w-0">{kn.teks}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2.5">
            {pilihan.kiri.map((kr) => {
              const peta = uraiJawabanMenjodohkan(nilaiSaatIni);
              const kodeKiriSemua = pilihan.kiri.map((item) => item.kode);
              const nilaiBaris = peta[kr.kode] ?? "";
              return (
                <div
                  key={kr.kode}
                  className="grid gap-2.5 rounded-2xl border border-white/70 bg-white/65 p-3.5 sm:grid-cols-[1fr_minmax(180px,240px)] sm:items-center"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-aura-primary/10 font-display text-[11px] font-bold text-aura-primary">
                      {kr.kode}
                    </span>
                    <span className="text-[15px] leading-snug font-medium text-aura-ink">{kr.teks}</span>
                  </div>
                  <select
                    aria-label={`Pasangan untuk ${kr.teks}`}
                    value={nilaiBaris}
                    onChange={(e) => {
                      const baru = { ...peta };
                      if (e.target.value) baru[kr.kode] = e.target.value;
                      else delete baru[kr.kode];
                      onPilih(formatJawabanMenjodohkan(baru, kodeKiriSemua));
                    }}
                    className="min-h-12 w-full rounded-xl border border-aura-primary/25 bg-white px-3 font-body text-[14px] font-medium text-aura-ink shadow-sm"
                  >
                    <option value="">Pilih pasangan…</option>
                    {pilihan.kanan.map((kn) => (
                      <option key={kn.kode} value={kn.kode}>
                        {kn.kode}. {kn.teks}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. ESAI / URAIAN */}
      {tipe === "esai" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="input-jawaban-esai" className="sr-only">
            Jawaban uraian
          </label>
          <textarea
            id="input-jawaban-esai"
            rows={5}
            maxLength={2000}
            placeholder="Tulis jawaban dan langkah penyelesaianmu di sini…"
            value={nilaiSaatIni}
            onChange={(e) => onPilih(e.target.value)}
            className="w-full resize-y rounded-2xl border border-aura-primary/25 bg-white/80 p-4 font-body text-base leading-relaxed text-aura-ink shadow-sm placeholder:text-aura-muted/55 focus:border-aura-primary focus:bg-white"
          />
          <div className="flex items-center justify-between text-[12px] text-aura-muted">
            <span>Jawaban uraian akan diperiksa oleh gurumu.</span>
            <span>{nilaiSaatIni.length}/2000</span>
          </div>
        </div>
      )}
    </KartuKaca>
  );
}
