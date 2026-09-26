import type { ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";

interface TombolProps {
  varian: "utama" | "sekunder" | "teks";
  /** `besar` = 52px untuk halaman siswa (design.md 4.3). */
  ukuran?: "standar" | "besar";
  ikon?: LucideIcon;
  memuat?: boolean;
  lebarPenuh?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

const KELAS_VARIAN: Record<TombolProps["varian"], string> = {
  utama: "px-6 rounded-tombol bg-primer text-white hover:bg-primer-hover",
  sekunder: "kaca px-6 rounded-tombol text-primer hover:bg-primer-lembut",
  teks: "px-2 text-primer hover:underline",
};

export function Tombol({
  varian,
  ukuran = "standar",
  ikon: Ikon,
  memuat = false,
  lebarPenuh = false,
  type = "button",
  disabled = false,
  onClick,
  children,
}: TombolProps) {
  const nonaktif = disabled || memuat;
  const kelas = [
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
    KELAS_VARIAN[varian],
    ukuran === "besar" ? "h-13" : "h-12",
    lebarPenuh ? "w-full" : "",
  ].join(" ");

  return (
    <button type={type} className={kelas} disabled={nonaktif} aria-busy={memuat || undefined} onClick={onClick}>
      {memuat ? (
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      ) : (
        Ikon && <Ikon aria-hidden="true" className="size-5" />
      )}
      {children}
    </button>
  );
}
