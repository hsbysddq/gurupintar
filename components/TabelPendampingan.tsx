import { ArrowRight, CheckCircle2, CircleHelp, ListPlus, Loader2 } from "lucide-react";
import type {
  KategoriPemahaman,
  SiswaPendampingan,
  TindakanPendampingan,
} from "@/lib/tipe";

const LABEL: Record<KategoriPemahaman, string> = {
  paham: "Paham",
  setengah: "Setengah Paham",
  belum: "Belum Paham",
  "tidak-mengerjakan": "Tidak mengerjakan",
  "belum-cukup": "Data belum cukup",
};

const WARNA: Record<KategoriPemahaman, string> = {
  paham: "bg-aura-emerald/10 text-[#047857]",
  setengah: "bg-aura-amber/10 text-[#8A6400]",
  belum: "bg-aura-red/10 text-[#B4432B]",
  "tidak-mengerjakan": "bg-aura-indigo/10 text-aura-indigo",
  "belum-cukup": "bg-aura-muted/10 text-aura-muted",
};

export type JenisTabelPendampingan = "menunggu" | "pendampingan" | "evaluasi";

type TabelPendampinganProps = {
  data: SiswaPendampingan[];
  jenis: JenisTabelPendampingan;
  onTindakan: (siswaId: string, tindakan: TindakanPendampingan) => void;
  menyimpan: string | null;
  nonaktif: boolean;
};

function KategoriBadge({ kategori }: { kategori: KategoriPemahaman }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-display text-[11px] font-semibold ${WARNA[kategori]}`}
    >
      {LABEL[kategori]}
    </span>
  );
}

function TombolAksi({
  siswa,
  jenis,
  onTindakan,
  menyimpan,
  nonaktif,
}: {
  siswa: SiswaPendampingan;
  jenis: JenisTabelPendampingan;
  onTindakan: TabelPendampinganProps["onTindakan"];
  menyimpan: string | null;
  nonaktif: boolean;
}) {
  if (jenis === "menunggu") {
    const memuatPendampingan = menyimpan === `${siswa.siswaId}:pendampingan`;
    const memuatEvaluasi = menyimpan === `${siswa.siswaId}:evaluasi`;
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={nonaktif || Boolean(menyimpan)}
          onClick={() => onTindakan(siswa.siswaId, "pendampingan")}
          className="aura-btn aura-btn-primary h-10 px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {memuatPendampingan ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <ListPlus aria-hidden="true" className="size-3.5" />
          )}
          Masukkan ke pendampingan
        </button>
        <button
          type="button"
          disabled={nonaktif || Boolean(menyimpan)}
          onClick={() => onTindakan(siswa.siswaId, "evaluasi")}
          className="aura-btn aura-btn-secondary h-10 px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {memuatEvaluasi ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-3.5" />
          )}
          Lanjut evaluasi
        </button>
      </div>
    );
  }

  if (jenis === "pendampingan") {
    const memuat = menyimpan === `${siswa.siswaId}:selesai`;
    return (
      <button
        type="button"
        disabled={nonaktif || Boolean(menyimpan)}
        onClick={() => onTindakan(siswa.siswaId, "selesai")}
        className="aura-btn aura-btn-primary h-10 px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {memuat ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        ) : (
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
        )}
        Selesai pendampingan
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[12px] leading-[18px] font-medium text-aura-muted">
      <CircleHelp aria-hidden="true" className="size-3.5" />
      {siswa.status === "selesai" ? "Pendampingan selesai" : "Lanjut evaluasi berikutnya"}
    </span>
  );
}

export function TabelPendampingan({
  data,
  jenis,
  onTindakan,
  menyimpan,
  nonaktif,
}: TabelPendampinganProps) {
  if (data.length === 0) {
    return (
      <p className="aura-glass rounded-[24px] px-5 py-6 font-body text-[13px] leading-[20px] text-aura-muted">
        Tidak ada siswa di bagian ini.
      </p>
    );
  }

  return (
    <div className="aura-glass overflow-hidden rounded-[24px]">
      <ul className="divide-y divide-white/60 md:hidden">
        {data.map((siswa) => (
          <li key={siswa.siswaId} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-[14px] leading-[20px] font-semibold text-aura-ink">{siswa.nama}</p>
                <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
                  {siswa.rataRata === null ? "Rata-rata belum ada" : `Rata-rata ${siswa.rataRata}%`} ·{" "}
                  {siswa.jumlahDikerjakan}/{siswa.jumlahKuis} kuis
                </p>
              </div>
              <KategoriBadge kategori={siswa.kategori} />
            </div>
            <TombolAksi
              siswa={siswa}
              jenis={jenis}
              onTindakan={onTindakan}
              menyimpan={menyimpan}
              nonaktif={nonaktif}
            />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Daftar siswa, kategori pemahaman, rata-rata nilai, dan tindakan</caption>
          <thead>
            <tr className="border-b border-white/60 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
              <th scope="col" className="px-4 py-3">Nama</th>
              <th scope="col" className="px-4 py-3">Rata-rata</th>
              <th scope="col" className="px-4 py-3">Kuis</th>
              <th scope="col" className="px-4 py-3">Kategori</th>
              <th scope="col" className="px-4 py-3">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {data.map((siswa) => (
              <tr key={siswa.siswaId} className="border-b border-white/50 align-middle last:border-b-0">
                <th scope="row" className="px-4 py-3 font-display text-[13px] font-semibold text-aura-ink">
                  {siswa.nama}
                </th>
                <td className="px-4 py-3 font-body text-[13px] text-aura-muted">
                  {siswa.rataRata === null ? "—" : `${siswa.rataRata}%`}
                </td>
                <td className="px-4 py-3 font-body text-[13px] text-aura-muted">
                  {siswa.jumlahDikerjakan}/{siswa.jumlahKuis}
                </td>
                <td className="px-4 py-3">
                  <KategoriBadge kategori={siswa.kategori} />
                </td>
                <td className="px-4 py-3">
                  <TombolAksi
                    siswa={siswa}
                    jenis={jenis}
                    onTindakan={onTindakan}
                    menyimpan={menyimpan}
                    nonaktif={nonaktif}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
