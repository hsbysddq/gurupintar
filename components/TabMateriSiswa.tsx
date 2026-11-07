"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ExternalLink, FileText, Headphones, PlayCircle, type LucideIcon } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { PemutarAudioGemini } from "@/components/PemutarAudioGemini";
import { PenampilBacaan } from "@/components/PenampilBacaan";
import { ambilGayaAudio } from "@/lib/gaya-audio";
import type { Format, FormatMateri, IsiMateri } from "@/lib/tipe";

type TabMateriSiswaProps = {
  isi: IsiMateri;
  formatAwal: Format | null;
  hanyaFormat?: FormatMateri | null;
  /** Diisi di halaman siswa agar server memvalidasi akses materi sebelum membuat audio. */
  sesiId?: string;
};

const TAB: { format: Format; label: string; ikon: LucideIcon }[] = [
  { format: "video", label: "Video", ikon: PlayCircle },
  { format: "audio", label: "Audio", ikon: Headphones },
  { format: "bacaan", label: "Bacaan", ikon: FileText },
];

// PRD AC-7.2 s.d. AC-7.6, design.md 4.14.
export function TabMateriSiswa({ isi, formatAwal, hanyaFormat = null, sesiId }: TabMateriSiswaProps) {
  const idDasar = useId();
  const hanyaFormatAman = TAB.some((tab) => tab.format === hanyaFormat) ? hanyaFormat : null;
  const formatAwalAman = TAB.some((tab) => tab.format === formatAwal) ? formatAwal : null;
  const daftarTab = hanyaFormatAman ? TAB.filter((tab) => tab.format === hanyaFormatAman) : TAB;
  const [aktif, setAktif] = useState<Format>(hanyaFormatAman ?? formatAwalAman ?? "bacaan");
  const tombolTab = useRef<(HTMLButtonElement | null)[]>([]);

  function tanganiTombol(e: KeyboardEvent, indeks: number) {
    let tujuan: number | null = null;
    if (e.key === "ArrowRight") tujuan = (indeks + 1) % daftarTab.length;
    else if (e.key === "ArrowLeft") tujuan = (indeks - 1 + daftarTab.length) % daftarTab.length;
    else if (e.key === "Home") tujuan = 0;
    else if (e.key === "End") tujuan = daftarTab.length - 1;
    if (tujuan === null) return;
    e.preventDefault();
    setAktif(daftarTab[tujuan].format);
    tombolTab.current[tujuan]?.focus();
  }

  const urlYoutube = `https://www.youtube.com/results?search_query=${encodeURIComponent(isi.ide_video.kata_kunci_pencarian)}`;
  const gayaAudio = ambilGayaAudio(isi.gaya_audio);
  const judulAudio =
    gayaAudio.id === 'docu'
      ? 'Dengarkan ceritanya'
      : gayaAudio.id === 'podcast'
        ? 'Dengarkan podcast'
        : gayaAudio.id === 'dialog'
          ? 'Dengarkan dialog'
          : 'Dengarkan cerita';

  return (
    <div className={hanyaFormat ? "min-w-0" : "grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"}>
      {!hanyaFormat && (
      <div
        role="tablist"
        aria-label="Bentuk materi"
        className="aura-glass grid grid-cols-3 gap-1 p-1 lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-1.5 lg:p-2"
      >
        {daftarTab.map(({ format, label, ikon: Ikon }, i) => {
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
      )}

      <div className="min-w-0">
        {daftarTab.map(({ format }) => (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-aura-primary/15 bg-aura-primary/5 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-primary">
                        {gayaAudio.kode} — {gayaAudio.nama}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-aura-ink/5 px-2.5 py-1 font-display text-[10px] font-semibold text-aura-muted">
                        {gayaAudio.suara}
                      </span>
                    </div>
                    <h2 className="font-display text-xl leading-snug font-bold text-aura-ink">{judulAudio}</h2>
                    <PemutarAudioGemini
                      key={`${gayaAudio.id}:${sesiId ?? 'guru'}:${isi.naskah_audio.length}:${isi.naskah_audio.slice(0, 40)}`}
                      teks={isi.naskah_audio}
                      gaya={gayaAudio.id}
                      sesiId={sesiId}
                    />
                    <div className="rounded-2xl border border-aura-ink/10 bg-white/45 p-4">
                      <p className="font-display text-[10px] font-bold uppercase tracking-[0.05em] text-aura-muted">
                        Transkrip naskah
                      </p>
                      <p className="mt-2 whitespace-pre-line text-aura-ink">{isi.naskah_audio}</p>
                    </div>
                  </>
                )}
                {format === "bacaan" && <PenampilBacaan isi={isi} />}
              </KartuKaca>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

