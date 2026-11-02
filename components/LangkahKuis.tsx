import { Check } from "lucide-react";

const LANGKAH = [
  { nomor: 1, label: "Kode kuis" },
  { nomor: 2, label: "Pilih format" },
  { nomor: 3, label: "Kerjakan kuis" },
] as const;

export type NomorLangkah = (typeof LANGKAH)[number]["nomor"];

/** Indikator langkah alur kuis siswa. */
export function LangkahKuis({ aktif }: { aktif: NomorLangkah }) {
  return (
    <ol aria-label="Langkah kuis" className="flex w-full items-center gap-2 sm:gap-3">
      {LANGKAH.map((langkah, indeks) => {
        const selesai = langkah.nomor < aktif;
        const ini = langkah.nomor === aktif;
        return (
          <li
            key={langkah.nomor}
            aria-current={ini ? "step" : undefined}
            className={`flex min-w-0 items-center gap-2 ${indeks < LANGKAH.length - 1 ? "flex-1" : ""}`}
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold ${
                selesai
                  ? "bg-sudah text-white"
                  : ini
                    ? "bg-aura-primary text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)]"
                    : "border border-white/70 bg-white/55 text-aura-muted"
              }`}
            >
              {selesai ? <Check aria-hidden="true" className="size-3.5" /> : langkah.nomor}
            </span>
            <span
              className={`truncate font-display text-[11px] font-semibold sm:text-[12px] ${
                ini ? "text-aura-ink" : "text-aura-muted"
              }`}
            >
              {langkah.label}
            </span>
            {indeks < LANGKAH.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px min-w-4 flex-1 ${selesai ? "bg-aura-primary/35" : "bg-white/80"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
