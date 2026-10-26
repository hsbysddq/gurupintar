import {
  BarChart3,
  Clock3,
  FileText,
  Headphones,
  ListChecks,
  Pencil,
  PlayCircle,
  Send,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

const KELOMPOK: { label: string; jumlah: number; persen: number; warna: string }[] = [
  { label: "Belum Paham", jumlah: 16, persen: 42, warna: "bg-aura-red" },
  { label: "Setengah Paham", jumlah: 12, persen: 32, warna: "bg-aura-amber" },
  { label: "Sudah Paham", jumlah: 10, persen: 26, warna: "bg-aura-emerald" },
];

const BENTUK: { label: string; ikon: LucideIcon }[] = [
  { label: "Video", ikon: PlayCircle },
  { label: "Audio", ikon: Headphones },
  { label: "Bacaan", ikon: FileText },
  { label: "Latihan", ikon: Pencil },
];

const REKOMENDASI: { label: string; nilai: string; ikon: LucideIcon }[] = [
  { label: "Cek pemahaman", nilai: "5 soal", ikon: ListChecks },
  { label: "Buat materi", nilai: "3 draf", ikon: Sparkles },
  { label: "Bagikan", nilai: "ke siswa", ikon: Send },
];

/**
 * Pratinjau dasbor di hero landing: ringkasan satu kelas dengan data demo
 * (38 dari 40 siswa menjawab: 16 belum, 12 setengah, 10 sudah paham).
 */
export function PratinjauDasbor() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[48px] opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(37,99,235,0.2), transparent 58%), radial-gradient(circle at 80% 75%, rgba(139,92,246,0.18), transparent 60%)",
        }}
      />

      <div className="aura-glass-strong overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between gap-3 border-b border-white/60 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-aura-amber via-aura-red to-aura-violet p-0.5">
              <span className="flex size-full items-center justify-center rounded-full bg-white font-display text-[11px] font-extrabold tracking-tight text-aura-indigo">
                BR
              </span>
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[13px] leading-[18px] font-bold text-aura-ink">Bu Rina</p>
              <p className="truncate font-body text-[11px] leading-[16px] text-aura-muted">Kelas 7A · Matematika</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-aura-emerald/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-[#047857]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />
            Live
          </span>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-white/60 border-b border-white/60">
          <div className="min-w-0 px-3 py-3">
            <dt className="flex items-center gap-1 whitespace-nowrap font-display text-[9px] font-bold uppercase tracking-[0.02em] text-aura-muted sm:gap-1.5 sm:text-[10px]">
              <BarChart3 aria-hidden="true" className="size-3 shrink-0 text-aura-primary sm:size-3.5" />
              Rata-rata
            </dt>
            <dd className="mt-1 font-display text-[22px] leading-[26px] font-extrabold tracking-[-0.02em] tabular-nums text-aura-primary">
              72%
            </dd>
          </div>
          <div className="min-w-0 px-3 py-3">
            <dt className="flex items-center gap-1 whitespace-nowrap font-display text-[9px] font-bold uppercase tracking-[0.02em] text-aura-muted sm:gap-1.5 sm:text-[10px]">
              <Users aria-hidden="true" className="size-3 shrink-0 text-aura-indigo sm:size-3.5" />
              Siswa
            </dt>
            <dd className="mt-1 font-display text-[22px] leading-[26px] font-extrabold tracking-[-0.02em] tabular-nums text-aura-ink">
              40
            </dd>
          </div>
          <div className="min-w-0 px-3 py-3">
            <dt className="flex items-center gap-1 whitespace-nowrap font-display text-[9px] font-bold uppercase tracking-[0.02em] text-aura-muted sm:gap-1.5 sm:text-[10px]">
              <Clock3 aria-hidden="true" className="size-3 shrink-0 text-aura-violet sm:size-3.5" />
              Waktu
            </dt>
            <dd className="mt-1 font-display text-[22px] leading-[26px] font-extrabold tracking-[-0.02em] tabular-nums text-aura-ink">
              3 mnt
            </dd>
          </div>
        </dl>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted">
              Peta pemahaman
            </p>
            <span className="font-display text-[10px] font-bold tabular-nums text-aura-muted">38/40 menjawab</span>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <div
              role="img"
              aria-label="Sebaran pemahaman: 16 belum paham, 12 setengah paham, 10 sudah paham."
              className="relative size-[92px] shrink-0 rounded-full"
              style={{
                background:
                  "conic-gradient(var(--color-aura-red) 0 42%, var(--color-aura-amber) 42% 74%, var(--color-aura-emerald) 74% 100%)",
              }}
            >
              <span className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-white/95">
                <span className="font-display text-[20px] leading-[22px] font-extrabold tracking-[-0.02em] tabular-nums text-aura-ink">
                  38
                </span>
                <span className="font-display text-[8px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                  menjawab
                </span>
              </span>
            </div>

            <ul aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-1.5">
              {KELOMPOK.map((k) => (
                <li key={k.label} className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${k.warna}`} />
                  <span className="min-w-0 font-display text-[11px] leading-[16px] font-semibold text-aura-ink">
                    {k.label}
                  </span>
                  <span className="ml-auto shrink-0 font-display text-[10px] font-bold tabular-nums text-aura-muted">
                    {k.jumlah} · {k.persen}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/45 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                  Materi per kelompok
                </p>
                <span className="rounded-full bg-white/70 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                  4 bentuk
                </span>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {BENTUK.map(({ label, ikon: Ikon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-1.5 rounded-xl border border-aura-primary/10 bg-white/55 px-2 py-1.5"
                  >
                    <Ikon aria-hidden="true" className="size-3.5 shrink-0 text-aura-primary" />
                    <span className="font-display text-[10px] leading-[14px] font-semibold text-aura-ink">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-aura-primary/15 bg-aura-primary/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-primary">
                  Rekomendasi tindak lanjut
                </p>
                <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-aura-primary" />
              </div>
              <ol className="mt-2 flex flex-col gap-1.5">
                {REKOMENDASI.map(({ label, nilai, ikon: Ikon }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-aura-primary ring-1 ring-aura-primary/10">
                      <Ikon aria-hidden="true" className="size-3.5" />
                    </span>
                    <span className="min-w-0 font-display text-[10px] leading-[14px] font-semibold text-aura-ink">
                      {label}
                    </span>
                    <span className="ml-auto shrink-0 font-display text-[9px] font-bold tabular-nums text-aura-muted">
                      {nilai}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
