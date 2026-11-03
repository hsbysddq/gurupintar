import { ShieldAlert } from "lucide-react";
import type { SiswaCurang } from "@/lib/tipe";

export function DaftarSiswaCurang({ siswa }: { siswa: SiswaCurang[] }) {
  return (
    <section aria-labelledby="judul-siswa-curang" className="flex min-w-0 flex-col gap-3">
      <h3 id="judul-siswa-curang">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-belum-latar px-3 py-1 font-display text-[12px] font-bold text-belum-teks">
          <ShieldAlert aria-hidden="true" className="size-3.5" />
          Curang
          <span className="tabular-nums">{siswa.length}</span>
        </span>
      </h3>
      {siswa.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-tinta-lembut">Tidak ada siswa.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {siswa.map((s) => (
            <li key={s.siswaId} className="flex items-start justify-between gap-3 py-1 text-[15px] leading-relaxed">
              <span className="min-w-0">
                <span className="block truncate">{s.nama}</span>
                <span className="text-[12px] font-medium text-belum-teks">
                  {s.pelanggaran}× pindah tab
                </span>
              </span>
              <span className="shrink-0 rounded-kecil bg-belum-latar px-2 text-[12px] leading-normal font-semibold text-belum-teks">
                {s.skor !== null && s.total !== null ? `${s.skor}/${s.total}` : "Belum mengerjakan"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
