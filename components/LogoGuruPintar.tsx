import Image from "next/image";

type LogoGuruPintarProps = {
  /** Kelas untuk tinggi dan lebar logo, misalnya `h-8 w-auto`. */
  className?: string;
};

/** Emblem dari `public/logo.svg`, dipotong tanpa teks "Guru Pintarku" di `public/logo-mark.svg`. */
export function LogoGuruPintar({ className = "h-9 w-auto" }: LogoGuruPintarProps) {
  return (
    <Image
      src="/logo-mark.svg"
      alt=""
      aria-hidden="true"
      width={800}
      height={520}
      unoptimized
      loading="eager"
      className={`block object-contain ${className}`}
    />
  );
}
