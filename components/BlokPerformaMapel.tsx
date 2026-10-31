import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { GrafikPerforma } from "@/components/GrafikPerforma";
import { kalimatTren, ringkasPerforma, titikGrafik, type RiwayatKuis } from "@/lib/riwayat-siswa";
import { infoStatusMapel, type HasilStatusMapel, type StatusMapel } from "@/lib/status-mapel";

const WARNA_STATUS: Record<StatusMapel, string> = {
  aman: "bg-sudah-latar text-sudah-teks",
  "batas-aman": "bg-setengah-latar text-setengah-teks",
  "tidak-aman": "bg-belum-latar text-belum-teks",
  "tidak-mengerjakan": "bg-belum-latar text-belum-teks",
  "belum-cukup": "bg-aura-ink/5 text-aura-muted",
};

export function LencanaStatusMapel({ status }: { status: StatusMapel }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] leading-normal font-semibold ${WARNA_STATUS[status]}`}>
      {infoStatusMapel(status).label}
    </span>
  );
}

type Props = { riwayat: RiwayatKuis[]; hasil: HasilStatusMapel };

/** Status 3 kuis terakhir, kalimat tren, dan grafik nilai untuk satu mata pelajaran. */
export function BlokPerformaMapel({ riwayat, hasil }: Props) {
  const ringkas = ringkasPerforma(riwayat);
  const titik = titikGrafik(riwayat);
  const info = infoStatusMapel(hasil.status);
  const IkonTren = ringkas.perubahan === null || ringkas.perubahan === 0 ? Minus : ringkas.perubahan > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <LencanaStatusMapel status={hasil.status} />
          {hasil.rataRata !== null && (
            <span className="text-[13px] leading-normal text-aura-muted">Rata-rata 3 kuis terakhir: {hasil.rataRata}%</span>
          )}
        </div>
        <p className="text-[14px] leading-snug text-aura-muted">{info.pesan}</p>
      </div>
      <p className="flex items-start gap-2 text-[15px] leading-snug text-aura-muted">
        <IkonTren aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aura-primary" />
        {kalimatTren(ringkas.perubahan)}
      </p>
      {titik.length >= 2 ? (
        <GrafikPerforma titik={titik} />
      ) : (
        <p className="rounded-2xl bg-aura-primary/5 p-4 text-[15px] text-aura-muted">
          Grafik muncul setelah kamu mengerjakan minimal dua kuis di mapel ini.
        </p>
      )}
    </div>
  );
}
