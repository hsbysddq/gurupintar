import type { ReactNode } from "react";

interface KartuKacaProps {
  varian?: "standar" | "pekat";
  as?: "div" | "section" | "article";
  className?: string;
  children: ReactNode;
}

export function KartuKaca({ varian = "standar", as: Elemen = "div", className, children }: KartuKacaProps) {
  const kelasKaca = varian === "pekat" ? "aura-glass-strong" : "aura-glass";
  return <Elemen className={className ? `${kelasKaca} ${className}` : kelasKaca}>{children}</Elemen>;
}
