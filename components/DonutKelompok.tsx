"use client";

import { Pie, PieChart } from "recharts";
import { LABEL_KELOMPOK, URUTAN_TAMPIL_KELOMPOK, WARNA_KELOMPOK } from "@/components/BadgeKelompok";
import type { Kelompok } from "@/lib/tipe";

type DonutKelompokProps = {
  jumlah: Record<Kelompok, number>;
};

const WARNA_GRAFIK: Record<Kelompok, string> = {
  sudah: "var(--color-sudah)",
  setengah: "var(--color-setengah)",
  belum: "var(--color-belum)",
};
const WARNA_KOSONG = "rgb(26 29 41 / 0.08)";
const UKURAN = 176;

export function DonutKelompok({ jumlah }: DonutKelompokProps) {
  const total = URUTAN_TAMPIL_KELOMPOK.reduce((n, k) => n + jumlah[k], 0);
  const data =
    total === 0
      ? [{ nama: "kosong", nilai: 1, fill: WARNA_KOSONG }]
      : URUTAN_TAMPIL_KELOMPOK.map((k) => ({ nama: k, nilai: jumlah[k], fill: WARNA_GRAFIK[k] }));
  const ringkasan = (["sudah", "setengah", "belum"] as const)
    .map((k) => `${jumlah[k]} ${LABEL_KELOMPOK[k].toLowerCase()}`)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div role="img" aria-label={ringkasan} className="relative shrink-0" style={{ width: UKURAN, height: UKURAN }}>
        <PieChart width={UKURAN} height={UKURAN} accessibilityLayer={false}>
          <Pie
            data={data}
            dataKey="nilai"
            nameKey="nama"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          />
        </PieChart>
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[40px] leading-[1.1] font-bold">{total}</span>
          <span className="text-[13px] leading-normal font-medium text-tinta-lembut">menjawab</span>
        </div>
      </div>
      <ul aria-hidden="true" className="flex flex-col gap-2">
        {URUTAN_TAMPIL_KELOMPOK.map((k) => (
          <li key={k} className="flex items-center gap-2 text-[13px] leading-normal font-medium">
            <span className={`size-3 rounded-full ${WARNA_KELOMPOK[k].utama}`} />
            <span className={WARNA_KELOMPOK[k].teks}>{LABEL_KELOMPOK[k]}</span>
            <span className="text-tinta">{jumlah[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
