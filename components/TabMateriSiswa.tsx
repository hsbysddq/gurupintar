"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Headphones, Loader2, Pencil, PlayCircle, Presentation, type LucideIcon } from "lucide-react";
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
  { format: "video", label: "Video", ikon: PlayCircle },
  { format: "audio", label: "Audio", ikon: Headphones },
  { format: "bacaan", label: "Bacaan", ikon: FileText },
  { format: "ppt", label: "PPT", ikon: Presentation },
  { format: "latihan", label: "Latihan", ikon: Pencil },
];

// PRD AC-7.2 s.d. AC-7.6, design.md 4.14.
export function TabMateriSiswa({ isi, formatAwal }: TabMateriSiswaProps) {
  const idDasar = useId();
  const [aktif, setAktif] = useState<Format>(formatAwal ?? "bacaan");
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

  const urlYoutube = `https://www.youtube.com/results?search_query=${encodeURIComponent(isi.ide_video.kata_kunci_pencarian)}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <div
        role="tablist"
        aria-label="Bentuk materi"
        className="aura-glass grid grid-cols-5 gap-1 p-1 lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-1.5 lg:p-2"
      >
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
              className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[12px] leading-normal font-semibold transition-colors lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-[14px] ${
                terpilih
                  ? "bg-aura-primary text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.65)]"
                  : "text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary"
              }`}
            >
              <Ikon aria-hidden="true" className="size-5" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0">
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
              <KartuKaca className="flex flex-col gap-4 p-5 sm:p-6">
                {format === "video" && (
                  <>
                    <h2 className="font-display text-xl leading-snug font-bold text-aura-ink">{isi.ide_video.judul}</h2>
                    <p className="text-aura-muted">{isi.ide_video.deskripsi}</p>
                    <a
                      href={urlYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 items-center gap-2 font-display font-semibold text-aura-primary hover:underline"
                    >
                      <ExternalLink aria-hidden="true" className="size-5" />
                      Cari video di YouTube
                    </a>
                  </>
                )}
                {format === "audio" && (
                  <>
                    <h2 className="font-display text-xl leading-snug font-bold text-aura-ink">Dengarkan penjelasan</h2>
                    <TombolDengarkan teks={isi.naskah_audio} />
                    <p className="whitespace-pre-line text-aura-ink">{isi.naskah_audio}</p>
                  </>
                )}
                {format === "bacaan" && (
                  <>
                    <h2 className="font-display text-xl leading-snug font-bold text-aura-ink">{isi.judul}</h2>
                    <p className="whitespace-pre-line text-aura-ink">{isi.ringkasan}</p>
                  </>
                )}
                {format === "ppt" && <PenampilSlide isi={isi} />}
                {format === "latihan" && <LatihanInteraktif latihan={isi.latihan} />}
              </KartuKaca>
            )}
          </div>
        ))}
      </div>
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
      <h2 className="font-display text-xl leading-snug font-bold text-aura-ink">{isi.slide_ppt.judul}</h2>

      <section
        aria-roledescription="slide"
        aria-label={`Slide ${indeks + 1} dari ${slide.length}: ${ini.judul}`}
        className="flex min-h-56 flex-col gap-3 rounded-2xl border border-aura-primary/15 bg-aura-primary/5 p-5"
      >
        <h3 className="font-display text-lg leading-snug font-bold text-aura-primary">{ini.judul}</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-aura-ink">
          {ini.poin.map((poin) => (
            <li key={poin}>{poin}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="order-first text-center text-[13px] leading-normal font-medium text-aura-muted sm:order-none">
          Slide {indeks + 1} dari {slide.length}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <button
            type="button"
            onClick={() => setIndeks((i) => Math.max(0, i - 1))}
            disabled={indeks === 0}
            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full px-3 font-semibold text-aura-primary hover:bg-aura-primary/10 disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setIndeks((i) => Math.min(slide.length - 1, i + 1))}
            disabled={indeks === slide.length - 1}
            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full px-3 font-semibold text-aura-primary hover:bg-aura-primary/10 disabled:opacity-40"
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
        className="inline-flex min-h-12 items-center gap-2 self-start font-semibold text-aura-primary hover:underline disabled:opacity-60"
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
