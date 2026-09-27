type PetaTitikKelasProps = {
  jumlah: { belum: number; setengah: number; sudah: number; belumMenjawab: number };
};

// Urutan sama dengan PetaKelas: Belum, Setengah, Sudah, lalu yang belum menjawab (design.md 4.18).
const JENIS = [
  { kunci: "belum", label: "Belum", labelPanjang: "belum paham", kelas: "bg-belum" },
  { kunci: "setengah", label: "Setengah", labelPanjang: "setengah paham", kelas: "bg-setengah" },
  { kunci: "sudah", label: "Sudah", labelPanjang: "sudah paham", kelas: "bg-sudah" },
  { kunci: "belumMenjawab", label: "belum menjawab", labelPanjang: "belum menjawab", kelas: "bg-tinta/15" },
] as const;

/**
 * Grid titik satu kelas untuk landing page; setiap titik satu siswa. Tanpa kartu pembungkus:
 * pemanggil yang menaruhnya di dalam kartu (design.md 4.2, tidak ada kaca di dalam kaca).
 */
export function PetaTitikKelas({ jumlah }: PetaTitikKelasProps) {
  const total = JENIS.reduce((n, j) => n + jumlah[j.kunci], 0);
  const titik = JENIS.flatMap((j) => Array.from({ length: jumlah[j.kunci] }, () => j.kelas));
  const ringkasan = JENIS.map((j) => `${jumlah[j.kunci]} ${j.labelPanjang}`).join(", ");

  return (
    <div className="flex flex-col gap-4">
      <div role="img" aria-label={`Peta ${total} siswa: ${ringkasan}.`} className="grid grid-cols-8 gap-2 sm:gap-2.5">
        {titik.map((kelas, i) => (
          <span key={i} aria-hidden="true" className={`aspect-square w-full rounded-full ${kelas}`} />
        ))}
      </div>

      {/* Ringkasan satu baris; sudah terwakili aria-label di atas. */}
      <p aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-normal font-medium">
        {JENIS.map((j, i) => (
          <span key={j.kunci} className="inline-flex items-center gap-1.5">
            {i > 0 && <span className="text-tinta-lembut">·</span>}
            <span className={`size-2.5 shrink-0 rounded-full ${j.kelas}`} />
            <span>
              <span className="font-bold">{jumlah[j.kunci]}</span> {j.label}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}
