import { Check, FileText, Headphones, Pencil, PlayCircle, Presentation, type LucideIcon } from "lucide-react";
import type { Format } from "@/lib/tipe";

type PilihanFormatProps = {
  nilai: Format | null;
  onPilih: (f: Format) => void;
};

const DAFTAR: { format: Format; label: string; deskripsi: string; ikon: LucideIcon }[] = [
  { format: "video", label: "Video", deskripsi: "Tonton penjelasan", ikon: PlayCircle },
  { format: "audio", label: "Audio", deskripsi: "Dengarkan materi", ikon: Headphones },
  { format: "bacaan", label: "Bacaan", deskripsi: "Baca ringkasan", ikon: FileText },
  { format: "ppt", label: "PPT", deskripsi: "Lihat slide", ikon: Presentation },
  { format: "latihan", label: "Latihan", deskripsi: "Uji pemahaman", ikon: Pencil },
];

export const LABEL_FORMAT: Record<Format, string> = Object.fromEntries(
  DAFTAR.map((item) => [item.format, item.label]),
) as Record<Format, string>;

export function PilihanFormat({ nilai, onPilih }: PilihanFormatProps) {
  return (
    <div role="radiogroup" aria-label="Bentuk materi" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {DAFTAR.map(({ format, label, deskripsi, ikon: Ikon }) => {
        const terpilih = nilai === format;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={terpilih}
            onClick={() => onPilih(format)}
            className={`relative flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-4 text-center transition-all ${
              terpilih
                ? "border-aura-primary bg-aura-primary/10 text-aura-primary shadow-[0_12px_30px_-16px_rgba(37,99,235,0.55)]"
                : "border-white/65 bg-white/55 text-aura-ink hover:-translate-y-0.5 hover:border-aura-primary/25 hover:bg-white/85"
            } last:col-span-2 sm:last:col-span-1`}
          >
            {terpilih && (
              <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-aura-primary text-white">
                <Check aria-hidden="true" className="size-3" />
              </span>
            )}
            <Ikon aria-hidden="true" className="size-7" />
            <span className="font-display text-[14px] leading-tight font-bold">{label}</span>
            <span className="text-[11px] leading-[16px] text-aura-muted">{deskripsi}</span>
          </button>
        );
      })}
    </div>
  );
}
