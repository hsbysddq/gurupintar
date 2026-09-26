import { KartuKaca } from "@/components/KartuKaca";
import { Tombol } from "@/components/Tombol";

type StatusHalamanProps = {
  jenis: "memuat" | "kosong" | "gagal";
  judul: string;
  pesan?: string;
  aksi?: { label: string; onClick: () => void };
};

export function StatusHalaman({ jenis, judul, pesan, aksi }: StatusHalamanProps) {
  if (jenis === "memuat") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        <span className="sr-only">{judul}</span>
        <div aria-hidden="true" className="h-6 w-2/3 animate-pulse rounded-kecil bg-tinta/10" />
        <div aria-hidden="true" className="h-4 w-full animate-pulse rounded-kecil bg-tinta/10" />
        <div aria-hidden="true" className="h-4 w-5/6 animate-pulse rounded-kecil bg-tinta/10" />
      </div>
    );
  }

  return (
    <KartuKaca className="flex flex-col gap-3 p-6">
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        <h2 className="text-xl leading-snug font-semibold">{judul}</h2>
        {pesan && <p className="text-tinta-lembut">{pesan}</p>}
      </div>
      {aksi && (
        <Tombol varian={jenis === "gagal" ? "utama" : "sekunder"} lebarPenuh onClick={aksi.onClick}>
          {aksi.label}
        </Tombol>
      )}
    </KartuKaca>
  );
}
