type KartuSoalKuisProps = {
  teks: string;
  pilihan: { kode: string; teks: string }[];
  terpilih: string | null;
  onPilih: (kode: string) => void;
};

export function KartuSoalKuis({ teks, pilihan, terpilih, onPilih }: KartuSoalKuisProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 id="teks-soal" className="font-display text-[22px] leading-snug font-bold text-aura-ink sm:text-2xl">
        {teks}
      </h2>
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
              className={`flex min-h-13 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                dipilih
                  ? "border-aura-primary bg-aura-primary/10 text-aura-ink"
                  : "border-white/65 bg-white/55 text-aura-ink hover:bg-aura-primary/5"
              }`}
            >
              <span className="font-display font-bold text-aura-primary">{p.kode}.</span>
              <span>{p.teks}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
