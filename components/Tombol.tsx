import type { ReactNode } from "react";
import Link from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";

interface TombolProps {
  /** `terang` = aksi utama di atas latar `primer` (pita penutup landing page, design.md 4.3). */
  varian: "utama" | "sekunder" | "teks" | "terang";
  /** `besar` = 52px untuk halaman siswa (design.md 4.3). */
  ukuran?: "standar" | "besar";
  ikon?: LucideIcon;
  memuat?: boolean;
  lebarPenuh?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  /** Jika diisi, dirender sebagai `<Link>` karena navigasi memakai tautan (design.md 5.8). */
  href?: string;
  children: ReactNode;
}

const KELAS_VARIAN: Record<TombolProps["varian"], string> = {
  utama: "px-6 rounded-tombol bg-primer text-white hover:bg-primer-hover",
  sekunder: "kaca px-6 rounded-tombol text-primer hover:bg-primer-lembut",
  teks: "px-2 text-primer hover:underline",
  terang: "px-6 rounded-tombol bg-white text-primer hover:bg-primer-lembut",
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
  href,
  children,
}: TombolProps) {
  const nonaktif = disabled || memuat;
  const kelas = [
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
    KELAS_VARIAN[varian],
    ukuran === "besar" ? "min-h-13" : "min-h-12",
    lebarPenuh ? "w-full" : "",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={kelas}>
        {Ikon && <Ikon aria-hidden="true" className="size-5" />}
        {children}
      </Link>
    );
  }

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
