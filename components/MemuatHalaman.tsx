import { Loader2 } from "lucide-react";

export function MemuatHalaman({ label = "Memuat halaman…" }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] w-full items-center justify-center px-4 py-10">
      <div
        role="status"
        aria-live="polite"
        className="aura-glass flex items-center gap-3 rounded-full px-5 py-3"
      >
        <Loader2 aria-hidden="true" className="size-5 animate-spin text-aura-primary" />
        <span className="font-display text-[13px] font-semibold text-aura-ink">{label}</span>
      </div>
    </div>
  );
}
