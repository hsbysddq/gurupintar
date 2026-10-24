import Image from "next/image";

type LogoGuruPintarProps = {
  /** Kelas untuk tinggi dan lebar logo, misalnya `h-8 w-auto`. */
  className?: string;
};

/** Logo brand dari `public/logo-mark.svg`, yaitu crop rapat dari `public/logo.svg`. */
export function LogoGuruPintar({ className = "h-9 w-auto" }: LogoGuruPintarProps) {
  return (
    <Image
      src="/logo-mark.svg"
      alt=""
      aria-hidden="true"
      width={1054}
      height={721}
      unoptimized
      loading="eager"
      className={`block object-contain ${className}`}
    />
  );
}
