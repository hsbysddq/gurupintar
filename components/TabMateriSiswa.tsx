"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ExternalLink, FileText, Headphones, Pencil, PlayCircle, type LucideIcon } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { LatihanInteraktif } from "@/components/LatihanInteraktif";
import { TombolDengarkan } from "@/components/TombolDengarkan";
import type { Format, IsiMateri } from "@/lib/tipe";

type TabMateriSiswaProps = {
  isi: IsiMateri;
  formatAwal: Format | null;
};

const TAB: { format: Format; label: string; ikon: LucideIcon }[] = [
  { format: "video", label: "Video", ikon: PlayCircle },
  { format: "audio", label: "Audio", ikon: Headphones },
  { format: "bacaan", label: "Bacaan", ikon: FileText },
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
              {format === "video" && (
                <>
                  <h2 className="text-xl leading-snug font-semibold">{isi.ide_video.judul}</h2>
                  <p>{isi.ide_video.deskripsi}</p>
                  <a
                    href={urlYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 font-semibold text-primer hover:underline"
                  >
                    <ExternalLink aria-hidden="true" className="size-5" />
                    Cari video di YouTube
                  </a>
                </>
              )}
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
