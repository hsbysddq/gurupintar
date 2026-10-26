import Image from "next/image";

const LAMBANG = { src: "/logo-transparan.svg", width: 828.38, height: 848.54 };
const TULISAN = { src: "/logo-tulisan-transparan.svg", width: 1985.88, height: 267.49 };

type LogoProps = {
  /** Kelas untuk tinggi dan lebar gambar, misalnya `h-8 w-auto`. */
  className?: string;
};

/** Emblem dari `public/logo.svg` tanpa latar putih. */
export function LogoGuruPintar({ className = "h-9 w-auto" }: LogoProps) {
  return (
    <Image
      src={LAMBANG.src}
      alt=""
      aria-hidden="true"
      width={LAMBANG.width}
      height={LAMBANG.height}
      unoptimized
      loading="eager"
      className={`block object-contain ${className}`}
    />
  );
}

/** Tulisan "Guru Pintarku" dari `public/logo-tulisan.svg` tanpa latar putih. */
export function TulisanGuruPintar({ className = "h-6 w-auto" }: LogoProps) {
  return (
    <Image
      src={TULISAN.src}
      alt=""
      aria-hidden="true"
      width={TULISAN.width}
      height={TULISAN.height}
      unoptimized
      loading="eager"
      className={`block object-contain ${className}`}
    />
  );
}
