import type { Kelompok } from "@/lib/tipe";

/** Label kelompok untuk guru (design.md 2.1). Jangan dipakai di halaman siswa. */
export const LABEL_KELOMPOK: Record<Kelompok, string> = {
  sudah: "Sudah Paham",
  setengah: "Setengah Paham",
  belum: "Belum Paham",
};

/** Kelas warna per kelompok; ditulis lengkap agar terbaca oleh Tailwind. */
export const WARNA_KELOMPOK: Record<Kelompok, { utama: string; teks: string; latar: string; sorot: string }> = {
  sudah: { utama: "bg-sudah", teks: "text-sudah-teks", latar: "bg-sudah-latar", sorot: "motion-safe:bg-sudah-latar" },
  setengah: {
    utama: "bg-setengah",
    teks: "text-setengah-teks",
    latar: "bg-setengah-latar",
    sorot: "motion-safe:bg-setengah-latar",
  },
  belum: { utama: "bg-belum", teks: "text-belum-teks", latar: "bg-belum-latar", sorot: "motion-safe:bg-belum-latar" },
};

/** Urutan tampilan untuk guru: Belum Paham lebih dulu (design.md 3.3). */
export const URUTAN_TAMPIL_KELOMPOK: Kelompok[] = ["belum", "setengah", "sudah"];

type BadgeKelompokProps = {
  kelompok: Kelompok;
};

export function BadgeKelompok({ kelompok }: BadgeKelompokProps) {
  const warna = WARNA_KELOMPOK[kelompok];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] leading-normal font-medium ${warna.latar} ${warna.teks}`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${warna.utama}`} />
      {LABEL_KELOMPOK[kelompok]}
    </span>
  );
}
