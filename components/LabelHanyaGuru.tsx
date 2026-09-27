import { Lock } from "lucide-react";

// PRD AC-8.1, design.md 4.15.
export function LabelHanyaGuru() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primer-lembut px-3 py-1 text-[13px] leading-normal font-medium text-primer">
      <Lock aria-hidden="true" className="size-4" />
      Hanya terlihat oleh guru
    </span>
  );
}
