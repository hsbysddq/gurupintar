import { BadgeKelompok, WARNA_KELOMPOK } from "@/components/BadgeKelompok";
import type { Kelompok } from "@/lib/tipe";

type DaftarSiswaKelompokProps = {
  kelompok: Kelompok;
  /** Sudah urut abjad dari API (AC-5.3). */
  siswa: { nama: string; skor: number; total: number }[];
};

export function DaftarSiswaKelompok({ kelompok, siswa }: DaftarSiswaKelompokProps) {
  const warna = WARNA_KELOMPOK[kelompok];
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3>
        <BadgeKelompok kelompok={kelompok} />
      </h3>
      {siswa.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-tinta-lembut">Tidak ada siswa.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {siswa.map((s) => (
            <li key={s.nama} className="flex items-center justify-between gap-3 py-1 text-[15px] leading-relaxed">
              <span className="truncate">{s.nama}</span>
              <span
                className={`shrink-0 rounded-kecil px-2 text-[13px] leading-normal font-medium ${warna.latar} ${warna.teks}`}
              >
                {s.skor}/{s.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
