import { Clock3, GraduationCap, Sparkles, Users } from "lucide-react";

const KELOMPOK = [
  { label: "Belum", jumlah: 16, lebar: "w-[42%]", warna: "bg-aura-red", garis: "" },
  { label: "Setengah", jumlah: 12, lebar: "w-[32%]", warna: "bg-aura-amber", garis: "border-l-2 border-white" },
  { label: "Sudah", jumlah: 10, lebar: "w-[26%]", warna: "bg-aura-emerald", garis: "border-l-2 border-white" },
];

/**
 * Pratinjau dasbor di hero landing: kartu kaca dengan ringkasan satu kelas.
 * Data tetap mengikuti sesi demo (38 siswa menjawab: 16 belum, 12 setengah, 10 sudah).
 */
export function PratinjauDasbor() {
  return (
    <div className="relative mx-auto w-full max-w-[480px]">
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
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-primary to-aura-indigo text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.6)]">
              <GraduationCap aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[13px] font-bold text-aura-ink">Peta kelas</p>
              <p className="truncate font-body text-[11px] leading-[16px] text-aura-muted">Kelas 7A · Matematika</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-aura-emerald/10 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-ink">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />
            Live
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">Sudah menjawab</p>
              <p className="mt-1 font-display text-[32px] leading-[38px] font-extrabold tracking-[-0.03em] text-aura-ink sm:text-[38px] sm:leading-[44px]">
                38<span className="text-[20px] font-bold text-aura-muted">/40</span>
              </p>
            </div>
            <div className="pb-1 text-right">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">Rata-rata</p>
              <p className="mt-1 font-display text-[24px] leading-[30px] font-extrabold tracking-[-0.02em] text-aura-primary">72%</p>
            </div>
          </div>

          <div className="mt-5">
            <div
              role="img"
              aria-label="Sebaran pemahaman: 16 belum paham, 12 setengah paham, 10 sudah paham."
              className="flex h-2.5 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-white/80"
            >
              {KELOMPOK.map((k) => (
                <span key={k.label} className={`h-full ${k.lebar} ${k.warna} ${k.garis}`} />
              ))}
            </div>
            <ul
              aria-hidden="true"
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted"
            >
              {KELOMPOK.map((k) => (
                <li key={k.label} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${k.warna}`} />
                  {k.jumlah} {k.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/60 bg-white/50 p-3">
              <Users aria-hidden="true" className="size-4 text-aura-primary" />
              <p className="mt-2 font-display text-[20px] leading-[24px] font-bold tracking-[-0.015em] text-aura-ink">3</p>
              <p className="font-body text-[11px] leading-[16px] text-aura-muted">kelompok belajar</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/50 p-3">
              <Clock3 aria-hidden="true" className="size-4 text-aura-indigo" />
              <p className="mt-2 font-display text-[20px] leading-[24px] font-bold tracking-[-0.015em] text-aura-ink">3 mnt</p>
              <p className="font-body text-[11px] leading-[16px] text-aura-muted">waktu menjawab</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-aura-primary/15 bg-aura-primary/5 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-aura-primary shadow-sm">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[12px] font-bold text-aura-ink">Materi lanjutan siap</p>
              <p className="font-body text-[11px] leading-[16px] text-aura-muted">3 draf menunggu diperiksa guru</p>
            </div>
          </div>
        </div>
      </div>

      <div className="aura-glass-subtle absolute -bottom-5 left-4 hidden items-center gap-2 rounded-full px-3.5 py-2 font-display text-[11px] font-bold text-aura-ink shadow-lg sm:flex">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-aura-emerald" />
        5 soal · hasil 3 detik
      </div>
    </div>
  );
}
