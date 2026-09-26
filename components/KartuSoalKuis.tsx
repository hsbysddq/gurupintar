type KartuSoalKuisProps = {
  teks: string;
  pilihan: { kode: string; teks: string }[];
  terpilih: string | null;
  onPilih: (kode: string) => void;
};

export function KartuSoalKuis({ teks, pilihan, terpilih, onPilih }: KartuSoalKuisProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 id="teks-soal" className="text-xl leading-snug font-semibold">
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
              className={`kaca flex min-h-13 w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                dipilih ? "border-2 border-primer bg-primer-lembut" : "hover:bg-primer-lembut"
              }`}
            >
              <span className="font-semibold text-primer">{p.kode}.</span>
              <span>{p.teks}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
