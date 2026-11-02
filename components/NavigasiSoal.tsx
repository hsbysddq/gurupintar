type NavigasiSoalProps = {
  total: number;
  indeks: number;
  terjawab: Set<number>;
  onPilih: (indeks: number) => void;
  disabled?: boolean;
};

/** Peta nomor soal: status sekarang, sudah dijawab, dan belum dijawab. */
export function NavigasiSoal({ total, indeks, terjawab, onPilih, disabled = false }: NavigasiSoalProps) {
  const jumlahTerjawab = terjawab.size;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[13px] font-bold text-aura-ink">Navigasi soal</p>
        <span className="rounded-full bg-aura-primary/10 px-2.5 py-1 font-display text-[11px] font-semibold text-aura-primary">
          {jumlahTerjawab}/{total} dijawab
        </span>
      </div>

      <ol className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const ini = i === indeks;
          const sudah = terjawab.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                aria-current={ini ? "step" : undefined}
                aria-label={`Soal ${i + 1}${sudah ? ", sudah dijawab" : ", belum dijawab"}${ini ? ", soal sekarang" : ""}`}
                disabled={disabled}
                onClick={() => onPilih(i)}
                className={`flex aspect-square w-full items-center justify-center rounded-xl border font-display text-[13px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  ini
                    ? "border-aura-primary bg-aura-primary text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.65)]"
                    : sudah
                      ? "border-sudah/25 bg-sudah-latar text-sudah-teks hover:border-sudah/45"
                      : "border-white/70 bg-white/55 text-aura-muted hover:border-aura-primary/25 hover:bg-aura-primary/5 hover:text-aura-primary"
                }`}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-[16px] text-aura-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-aura-primary" />
          Sekarang
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-sudah" />
          Sudah dijawab
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-aura-ink/15" />
          Belum
        </span>
      </div>
    </div>
  );
}
