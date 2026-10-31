"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Headphones,
  Loader2,
  Pencil,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { LatihanInteraktif } from "@/components/LatihanInteraktif";
import { TombolDengarkan } from "@/components/TombolDengarkan";
import { unduhPptx } from "@/lib/unduh-materi";
import type { Format, IsiMateri } from "@/lib/tipe";

type TabMateriSiswaProps = {
  isi: IsiMateri;
  formatAwal: Format | null;
};

const TAB: { format: Format; label: string; ikon: LucideIcon }[] = [
  { format: "ppt", label: "PPT", ikon: Presentation },
  { format: "audio", label: "Audio", ikon: Headphones },
  { format: "bacaan", label: "Bacaan", ikon: FileText },
  { format: "latihan", label: "Latihan", ikon: Pencil },
];

// PRD AC-7.2 s.d. AC-7.6, design.md 4.14.
export function TabMateriSiswa({ isi, formatAwal }: TabMateriSiswaProps) {
  const idDasar = useId();
  const [aktif, setAktif] = useState<Format>(formatAwal ?? "ppt");
  const tombolTab = useRef<(HTMLButtonElement | null)[]>([]);

  function tanganiTombol(e: KeyboardEvent, indeks: number) {
    let tujuan: number | null = null;
    if (e.key === "ArrowRight") tujuan = (indeks + 1) % TAB.length;
    else if (e.key === "ArrowLeft") tujuan = (indeks - 1 + TAB.length) % TAB.length;
    else if (e.key === "Home") tujuan = 0;
    else if (e.key === "End") tujuan = TAB.length - 1;
    if (tujuan === null) return;
    e.preventDefault();
    setAktif(TAB[tujuan].format);
    tombolTab.current[tujuan]?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Bentuk materi" className="kaca grid grid-cols-4 gap-1 p-1">
        {TAB.map(({ format, label, ikon: Ikon }, i) => {
          const terpilih = aktif === format;
          return (
            <button
              key={format}
              ref={(el) => {
                tombolTab.current[i] = el;
              }}
              id={`${idDasar}-tab-${format}`}
              type="button"
              role="tab"
              aria-selected={terpilih}
              aria-controls={`${idDasar}-panel-${format}`}
              tabIndex={terpilih ? 0 : -1}
              onClick={() => setAktif(format)}
              onKeyDown={(e) => tanganiTombol(e, i)}
              className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-kecil text-[13px] leading-normal font-semibold transition-colors ${
                terpilih ? "bg-primer text-white" : "text-tinta hover:bg-primer-lembut"
              }`}
            >
              <Ikon aria-hidden="true" className="size-5" />
              {label}
            </button>
          );
        })}
      </div>

      {TAB.map(({ format }) => (
        <div
          key={format}
          id={`${idDasar}-panel-${format}`}
          role="tabpanel"
          aria-labelledby={`${idDasar}-tab-${format}`}
          hidden={aktif !== format}
          tabIndex={0}
        >
          {aktif === format && (
            <KartuKaca className="flex flex-col gap-4 p-6">
              {format === "ppt" && <PenampilSlide isi={isi} />}
              {format === "audio" && (
                <>
                  <h2 className="text-xl leading-snug font-semibold">Dengarkan penjelasan</h2>
                  <TombolDengarkan teks={isi.naskah_audio} />
                  <p className="whitespace-pre-line">{isi.naskah_audio}</p>
                </>
              )}
              {format === "bacaan" && (
                <>
                  <h2 className="text-xl leading-snug font-semibold">{isi.judul}</h2>
                  <p className="whitespace-pre-line">{isi.ringkasan}</p>
                </>
              )}
              {format === "latihan" && <LatihanInteraktif latihan={isi.latihan} />}
            </KartuKaca>
          )}
        </div>
      ))}
    </div>
  );
}

/** Slide materi satu per satu dengan tombol Sebelumnya/Berikutnya; bisa diunduh sebagai PPTX (tanpa kunci latihan). */
function PenampilSlide({ isi }: { isi: IsiMateri }) {
  const slide = isi.slide_ppt.slide;
  const [indeks, setIndeks] = useState(0);
  const [mengunduh, setMengunduh] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const ini = slide[indeks];

  async function unduh() {
    setMengunduh(true);
    setGalat(null);
    try {
      await unduhPptx(isi, { denganLatihan: false });
    } catch {
      setGalat("File PPT belum berhasil dibuat. Coba lagi sebentar.");
    } finally {
      setMengunduh(false);
    }
  }

  return (
    <>
      <h2 className="text-xl leading-snug font-semibold">{isi.slide_ppt.judul}</h2>

      <section
        aria-roledescription="slide"
        aria-label={`Slide ${indeks + 1} dari ${slide.length}: ${ini.judul}`}
        className="flex min-h-56 flex-col gap-3 rounded-kecil border border-primer/20 bg-primer-lembut p-5"
      >
        <h3 className="text-lg leading-snug font-bold text-primer">{ini.judul}</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {ini.poin.map((poin) => (
            <li key={poin}>{poin}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="order-first text-center text-[13px] leading-normal font-medium text-tinta-lembut sm:order-none">
          Slide {indeks + 1} dari {slide.length}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <button
            type="button"
            onClick={() => setIndeks((i) => Math.max(0, i - 1))}
            disabled={indeks === 0}
            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-tombol px-3 font-semibold text-primer hover:bg-primer-lembut disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setIndeks((i) => Math.min(slide.length - 1, i + 1))}
            disabled={indeks === slide.length - 1}
            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-tombol px-3 font-semibold text-primer hover:bg-primer-lembut disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={unduh}
        disabled={mengunduh}
        aria-busy={mengunduh || undefined}
        className="inline-flex min-h-12 items-center gap-2 self-start font-semibold text-primer hover:underline disabled:opacity-60"
      >
        {mengunduh ? (
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="size-5" />
        )}
        {mengunduh ? "Menyiapkan file…" : "Unduh PPT"}
      </button>
      {galat && (
        <p role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
          {galat}
        </p>
      )}
    </>
  );
}
