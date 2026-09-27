import { DonutKelompok } from "@/components/DonutKelompok";

// Sama dengan sesi demo RIW004 (PRD 8.5): 38 siswa menjawab.
const JUMLAH_DEMO = { belum: 16, setengah: 12, sudah: 10 };

/**
 * Pratinjau produk di hero landing page (design.md 4.19): jendela dasbor tiruan berisi DonutKelompok
 * dengan data tetap. DonutKelompok sudah punya role="img", aria-label, legenda teks, dan tanpa animasi.
 */
export function PratinjauDasbor() {
  return (
    <div className="relative isolate mx-auto w-full max-w-md">
      {/* Latar dekoratif: gumpalan pastel dan pola titik yang memudar ke tepi. */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-10 -z-10">
        <div className="pola-titik absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)]" />
        <div className="absolute top-0 -left-6 size-56 rounded-full bg-blob-lavender opacity-70 blur-3xl" />
        <div className="absolute -right-4 bottom-0 size-56 rounded-full bg-blob-biru opacity-80 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 size-40 rounded-full bg-blob-pink opacity-60 blur-3xl" />
      </div>

      <div className="kaca-pekat overflow-hidden">
        <div className="flex items-center gap-3 border-b border-tinta/10 px-4 py-3">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-belum" />
            <span className="size-2.5 rounded-full bg-setengah" />
            <span className="size-2.5 rounded-full bg-sudah" />
          </span>
          <span className="text-[13px] leading-normal font-semibold text-tinta-lembut">Peta kelas · Kelas 7A</span>
        </div>
        <div className="flex justify-center px-6 py-8 sm:px-8 sm:py-10">
          <DonutKelompok jumlah={JUMLAH_DEMO} />
        </div>
      </div>
    </div>
  );
}
