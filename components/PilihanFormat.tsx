import { FileText, Headphones, PlayCircle, Presentation, type LucideIcon } from "lucide-react";
import type { Format } from "@/lib/tipe";

type PilihanFormatProps = {
  nilai: Format | null;
  onPilih: (f: Format) => void;
};

const DAFTAR: { format: Format; label: string; ikon: LucideIcon }[] = [
  { format: "video", label: "Video", ikon: PlayCircle },
  { format: "audio", label: "Audio", ikon: Headphones },
  { format: "bacaan", label: "Bacaan", ikon: FileText },
  { format: "ppt", label: "PPT", ikon: Presentation },
];

export function PilihanFormat({ nilai, onPilih }: PilihanFormatProps) {
  return (
    <div role="radiogroup" aria-label="Bentuk materi" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {DAFTAR.map(({ format, label, ikon: Ikon }) => {
        const terpilih = nilai === format;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={terpilih}
            onClick={() => onPilih(format)}
            className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border p-4 font-display text-[14px] font-semibold transition-all md:min-h-32 ${
              terpilih
                ? "border-aura-primary bg-aura-primary/10 text-aura-primary shadow-[0_10px_30px_-16px_rgba(37,99,235,0.5)]"
                : "border-white/65 bg-white/55 text-aura-ink hover:border-aura-primary/25 hover:bg-white/80"
            }`}
          >
            <Ikon aria-hidden="true" className="size-8" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
