import { KartuKaca } from "@/components/KartuKaca";

type KartuSoalKuisProps = {
  teks: string;
  pilihan: { kode: string; teks: string }[];
  terpilih: string | null;
  onPilih: (kode: string) => void;
};

export function KartuSoalKuis({ teks, pilihan, terpilih, onPilih }: KartuSoalKuisProps) {
  return (
    <KartuKaca as="section" className="flex flex-col gap-5 p-5 sm:p-6">
      <div>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-muted">Pilih satu jawaban</p>
        <h2 id="teks-soal" className="mt-2 font-display text-[22px] leading-snug font-bold text-aura-ink sm:text-2xl">
          {teks}
        </h2>
      </div>
      <div role="radiogroup" aria-labelledby="teks-soal" className="flex flex-col gap-3">
        {pilihan.map((p) => {
          const dipilih = terpilih === p.kode;
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
              <span className="min-w-0">{p.teks}</span>
            </button>
          );
        })}
      </div>
    </KartuKaca>
  );
}
