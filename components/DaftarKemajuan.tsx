import { TrendingUp } from "lucide-react";
import { LABEL_KELOMPOK } from "@/components/BadgeKelompok";
import { KartuKaca } from "@/components/KartuKaca";
import type { Kelompok } from "@/lib/tipe";

type DaftarKemajuanProps = {
  data: { nama: string; dari: Kelompok; ke: Kelompok }[];
};

// PRD AC-8.5, design.md 4.15.
export function DaftarKemajuan({ data }: DaftarKemajuanProps) {
  return (
    <KartuKaca className="p-6">
      {data.length === 0 ? (
        <p className="text-tinta-lembut">Belum ada siswa yang mengalami kemajuan.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((s) => (
            <li key={s.nama} className="flex items-center gap-3">
              <TrendingUp aria-hidden="true" className="size-5 shrink-0 text-sudah-teks" />
              <span>
                <span className="font-semibold">{s.nama}</span>: {LABEL_KELOMPOK[s.dari]} ke {LABEL_KELOMPOK[s.ke]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </KartuKaca>
  );
}
