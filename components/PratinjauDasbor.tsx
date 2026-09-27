import { Lightbulb } from "lucide-react";
import { PetaTitikKelas } from "@/components/PetaTitikKelas";

// Sama dengan sesi demo RIW004 (PRD 8.5): 38 menjawab, soal 5 salah 28 dari 38 (74%).
const JUMLAH_DEMO = { belum: 16, setengah: 12, sudah: 10, belumMenjawab: 2 };

const KELAS_KARTU_MELAYANG =
  "kaca-pekat flex items-start gap-2.5 px-4 py-3 text-[13px] leading-normal font-semibold sm:absolute sm:max-w-60";

/**
 * Pratinjau produk di hero landing page (design.md 4.20): jendela dasbor tiruan berisi peta kelas,
 * dengan satu kartu melayang yang menumpuk di tepi kiri bawahnya mulai 640px dan ditaruh di bawah jendela di HP.
 */
export function PratinjauDasbor() {
  return (
    <figure className="relative isolate mx-auto w-full max-w-md">
      {/* Latar dekoratif: gumpalan pastel dan pola titik yang memudar ke tepi. */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-10 -z-10">
        <div className="pola-titik absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)]" />
        <div className="absolute top-0 -left-6 size-56 rounded-full bg-blob-lavender opacity-70 blur-3xl" />
        <div className="absolute -right-4 bottom-0 size-56 rounded-full bg-blob-biru opacity-80 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 size-40 rounded-full bg-blob-pink opacity-60 blur-3xl" />
      </div>

      <div className="flex flex-col gap-3 sm:block">
        <div className="kaca-pekat overflow-hidden">
          <div className="flex items-center gap-3 border-b border-tinta/10 px-4 py-3">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-belum" />
              <span className="size-2.5 rounded-full bg-setengah" />
              <span className="size-2.5 rounded-full bg-sudah" />
            </span>
            <span className="text-[13px] leading-normal font-semibold text-tinta-lembut">Peta kelas · Kelas 7A</span>
          </div>
          <div className="p-5 sm:p-6">
            <PetaTitikKelas jumlah={JUMLAH_DEMO} />
          </div>
        </div>

        {/* Kiri bawah: menjembatani jendela dengan kolom teks hero di desktop. */}
        <p className={`${KELAS_KARTU_MELAYANG} sm:-bottom-7 sm:-left-6`}>
          <Lightbulb aria-hidden="true" className="mt-px size-4 shrink-0 text-setengah-teks" />
          <span>
            Soal paling banyak salah: Nomor 5 · <span className="text-belum-teks">74% salah</span>
          </span>
        </p>
      </div>

      {/* Di ≥640px diberi jarak agar tidak tertutup kartu melayang di kiri bawah. */}
      <figcaption className="mt-4 text-center text-[13px] leading-normal font-medium text-tinta-lembut sm:mt-14">
        <span className="sr-only">Contoh tampilan dasbor kelas demo. </span>
        Satu kelas, 40 siswa, terpetakan dalam hitungan menit.
      </figcaption>
    </figure>
  );
}
