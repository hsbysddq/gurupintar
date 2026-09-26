import { Lightbulb } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { pesanTanpaSoalTersulit } from "@/lib/ringkasan-hasil";
import type { SoalTersulit } from "@/lib/tipe";

type KartuSoalTersulitProps = {
  data: SoalTersulit | null;
  /** Membedakan "belum ada jawaban" dari "ada hasil tanpa rincian jawaban per soal". */
  jumlahMenjawab: number;
};

export function KartuSoalTersulit({ data, jumlahMenjawab }: KartuSoalTersulitProps) {
  return (
    <KartuKaca as="section" className="flex gap-4 p-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-kecil bg-setengah-latar text-setengah-teks">
        <Lightbulb aria-hidden="true" className="size-6" />
      </span>
      {data === null ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-xl leading-snug font-semibold">Soal paling banyak salah</h2>
          <p className="text-[15px] leading-relaxed text-tinta-lembut">{pesanTanpaSoalTersulit(jumlahMenjawab)}</p>
        </div>
      ) : (
        <div className="flex max-w-prose flex-col gap-2">
          <h2 className="text-xl leading-snug font-semibold">Soal paling banyak salah: Nomor {data.nomor}</h2>
          <p className="text-[15px] leading-relaxed">{data.teks}</p>
          <p className="text-[15px] leading-relaxed font-semibold text-belum-teks">
            {data.persenSalah}% siswa menjawab salah
          </p>
          {data.miskonsepsi && (
            <p className="text-[15px] leading-relaxed text-tinta-lembut">
              <span className="font-semibold text-tinta">Kesalahan pemahaman yang paling sering: </span>
              {data.miskonsepsi}
            </p>
          )}
        </div>
      )}
    </KartuKaca>
  );
}
