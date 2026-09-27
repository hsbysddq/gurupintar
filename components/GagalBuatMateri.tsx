import { CircleAlert } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";

type GagalBuatMateriProps = {
  onCobaLagi: () => void;
  onGunakanCadangan: () => void;
  onBatal?: () => void;
  sibuk?: boolean;
};

// PRD AC-6.3 dan AC-6.4, design.md 4.17.
export function GagalBuatMateri({ onCobaLagi, onGunakanCadangan, onBatal, sibuk = false }: GagalBuatMateriProps) {
  return (
    <KartuKaca varian="pekat" className="flex flex-col gap-4 p-6">
      <div role="alert" className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-belum-teks" />
        <div className="flex flex-col gap-1">
          <p className="text-xl leading-snug font-semibold">Materi belum berhasil dibuat.</p>
          <p className="text-tinta-lembut">Coba sekali lagi, atau pakai materi cadangan yang sudah disiapkan tim.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Tombol varian="sekunder" disabled={sibuk} onClick={onCobaLagi}>
          Coba lagi
        </Tombol>
        <Tombol varian="utama" memuat={sibuk} onClick={onGunakanCadangan}>
          Gunakan materi cadangan
        </Tombol>
        {onBatal && (
          <Tombol varian="teks" disabled={sibuk} onClick={onBatal}>
            Batal
          </Tombol>
        )}
      </div>
    </KartuKaca>
  );
}
