import { Presentation, type LucideIcon } from "lucide-react";
import type { Format } from "@/lib/tipe";

type PilihanFormatProps = {
  nilai: Format | null;
  onPilih: (f: Format) => void;
};

const DAFTAR: { format: Format; label: string; ikon: LucideIcon }[] = [
  { format: "ppt", label: "PPT", ikon: Presentation },
];

export function PilihanFormat({ nilai, onPilih }: PilihanFormatProps) {
  return (
    <div role="radiogroup" aria-label="Bentuk materi" className="grid grid-cols-1 gap-3">
      {DAFTAR.map(({ format, label, ikon: Ikon }) => {
        const terpilih = nilai === format;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={terpilih}
            onClick={() => onPilih(format)}
            className={`kaca flex min-h-28 flex-col items-center justify-center gap-2 p-4 font-semibold transition-colors ${
              terpilih ? "border-2 border-primer bg-primer-lembut text-primer" : "text-tinta hover:bg-primer-lembut"
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
