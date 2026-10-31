"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TitikGrafik } from "@/lib/riwayat-siswa";

type GrafikPerformaProps = { titik: TitikGrafik[] };

/** Grafik garis nilai (persen) dari kuis ke kuis. Warna tunggal agar tidak menyiratkan label kelompok. */
export function GrafikPerforma({ titik }: GrafikPerformaProps) {
  const ringkasan = titik.map((t) => `${t.label}: ${t.persen} persen`).join(", ");
  return (
    <div role="img" aria-label={`Grafik nilai dari kuis ke kuis. ${ringkasan}`} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={titik} margin={{ top: 12, right: 12, bottom: 4, left: -16 }} accessibilityLayer={false}>
          <CartesianGrid stroke="rgb(26 29 41 / 0.08)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-aura-muted)" }} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-aura-muted)" }}
          />
          <Tooltip
            formatter={(nilai) => [`${String(nilai)}%`, "Nilai"]}
            labelFormatter={(_, payload) => {
              const t = payload?.[0]?.payload as TitikGrafik | undefined;
              return t ? `${t.judul} (${t.skor}/${t.total} benar)` : "";
            }}
          />
          <Line
            type="monotone"
            dataKey="persen"
            stroke="var(--color-aura-primary)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--color-aura-primary)", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
