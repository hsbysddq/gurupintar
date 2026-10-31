type ProgressKuisProps = {
  saatIni: number;
  total: number;
};

export function ProgressKuis({ saatIni, total }: ProgressKuisProps) {
  const persen = total > 0 ? Math.round((saatIni / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] leading-normal font-medium text-aura-muted">
        Soal {saatIni} dari {total}
      </p>
      <div
        role="progressbar"
        aria-label="Kemajuan kuis"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={saatIni}
        className="h-2 overflow-hidden rounded-full bg-aura-primary/10"
      >
        <div className="h-full rounded-full bg-aura-primary transition-[width] duration-200" style={{ width: `${persen}%` }} />
      </div>
    </div>
  );
}
