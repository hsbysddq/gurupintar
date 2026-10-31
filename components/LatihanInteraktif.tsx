"use client";

import { useId, useState } from "react";
import { CircleCheck, CircleDashed } from "lucide-react";
import { Tombol } from "@/components/Tombol";
import type { IsiMateri, KodePilihan } from "@/lib/tipe";

type LatihanInteraktifProps = {
  latihan: IsiMateri["latihan"];
};

const KODE: KodePilihan[] = ["A", "B", "C", "D"];

// PRD AC-7.6, design.md 4.14: setelah memilih, siswa melihat benar/belum tepat dan pembahasan.
export function LatihanInteraktif({ latihan }: LatihanInteraktifProps) {
  const idDasar = useId();
  const [indeks, setIndeks] = useState(0);
  const [pilihan, setPilihan] = useState<KodePilihan | null>(null);

  const soal = latihan[indeks];
  const sudahMenjawab = pilihan !== null;
  const benar = pilihan === soal.kunci;
  const terakhir = indeks === latihan.length - 1;
  const idSoal = `${idDasar}-soal`;

  return (
    <section className="flex flex-col gap-4">
      <p className="text-[13px] leading-normal font-medium text-aura-muted">
        Soal {indeks + 1} dari {latihan.length}
      </p>
      <h2 id={idSoal} className="font-display text-xl leading-snug font-bold text-aura-ink">
        {soal.soal}
      </h2>

      <div role="radiogroup" aria-labelledby={idSoal} className="flex flex-col gap-3">
        {soal.pilihan.map((teks, i) => {
          const kode = KODE[i];
          const dipilih = pilihan === kode;
          return (
            <button
              key={kode}
              type="button"
              role="radio"
              aria-checked={dipilih}
              disabled={sudahMenjawab}
              onClick={() => setPilihan(kode)}
              className={`flex min-h-13 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-default ${
                dipilih
                  ? "border-aura-primary bg-aura-primary/10"
                  : sudahMenjawab
                    ? "border-white/60 bg-white/50"
                    : "border-white/65 bg-white/55 hover:bg-aura-primary/5"
              }`}
            >
              <span className="font-display font-bold text-aura-primary">{kode}.</span>
              <span>{teks}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {sudahMenjawab && (
          <div className={`flex flex-col gap-2 rounded-2xl p-4 ${benar ? "bg-sudah-latar" : "bg-belum-latar"}`}>
            <p className={`inline-flex items-center gap-2 font-semibold ${benar ? "text-sudah-teks" : "text-belum-teks"}`}>
              {benar ? (
                <CircleCheck aria-hidden="true" className="size-5" />
              ) : (
                <CircleDashed aria-hidden="true" className="size-5" />
              )}
              {benar ? "Benar" : "Belum tepat"}
            </p>
            {!benar && <p className="font-medium">Jawaban yang tepat: {soal.kunci}.</p>}
            <p className="text-aura-ink">{soal.pembahasan}</p>
          </div>
        )}
      </div>

      {sudahMenjawab && (
        <Tombol
          varian="sekunder"
          ukuran="besar"
          lebarPenuh
          onClick={() => {
            setIndeks(terakhir ? 0 : indeks + 1);
            setPilihan(null);
          }}
        >
          {terakhir ? "Ulangi latihan" : "Coba soal berikutnya"}
        </Tombol>
      )}
    </section>
  );
}
