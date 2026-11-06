import { ambilGayaBacaan } from '@/lib/gaya-bacaan';
import type { GayaBacaan } from '@/lib/tipe';

export function IlustrasiBacaan({
  gaya,
  className,
}: {
  gaya: GayaBacaan;
  className?: string;
}) {
  const warna = ambilGayaBacaan(gaya);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="174" cy="34" r="25" fill={warna.aksen} opacity="0.16" />
      <circle cx="38" cy="122" r="18" fill={warna.aksen} opacity="0.1" />
      <path d="M44 52c18-10 36-10 54 0v54c-18-8-36-8-54 0V52Z" fill={warna.kertas} stroke={warna.aksen} strokeWidth="2" />
      <path d="M98 52c18-10 36-10 54 0v54c-18-8-36-8-54 0V52Z" fill={warna.kertas} stroke={warna.aksen} strokeWidth="2" />
      <path d="M98 52v54" stroke={warna.aksen} strokeWidth="2" opacity="0.5" />
      <path d="M56 67h29M56 77h23M56 87h27" stroke={warna.aksen} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <path d="M110 67h29M110 77h23M110 87h27" stroke={warna.aksen} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <path d="M150 39l3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill={warna.aksen} opacity="0.75" />
      <path d="M44 34l2-5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill={warna.aksen} opacity="0.5" />
      <path d="M28 72h12M34 66v12" stroke={warna.aksen} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}
