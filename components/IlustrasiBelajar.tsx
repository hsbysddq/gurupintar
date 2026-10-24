/** Ilustrasi sederhana untuk header beranda siswa: siswa membaca di depan laptop, ada tanaman dan bintang kecil. */
export function IlustrasiBelajar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 130"
      role="img"
      aria-label="Siswa belajar di depan laptop"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="130" cy="122" rx="120" ry="6" className="fill-aura-primary/10" />

      <path d="M24 10l2.2 5.8L32 18l-5.8 2.2L24 26l-2.2-5.8L16 18l5.8-2.2z" className="fill-aura-amber" />
      <path d="M62 34l1.4 3.6L67 39l-3.6 1.4L62 44l-1.4-3.6L57 39l3.6-1.4z" className="fill-aura-violet" />

      {/* Meja dan laptop */}
      <rect x="40" y="104" width="150" height="8" rx="4" className="fill-aura-outline" />
      <rect x="54" y="78" width="62" height="26" rx="4" className="fill-aura-ink" />
      <rect x="58" y="82" width="54" height="18" rx="2" className="fill-aura-primary/30" />
      <rect x="48" y="102" width="74" height="4" rx="2" className="fill-aura-muted" />

      {/* Siswa */}
      <path d="M132 104c0-22 8-38 22-38s22 16 22 38z" className="fill-aura-indigo" />
      <circle cx="154" cy="48" r="14" className="fill-aura-amber/80" />
      <path d="M140 46c0-10 6-16 15-16s14 6 14 14c-6-3-14-5-29 2z" className="fill-aura-ink" />
      <rect x="128" y="76" width="26" height="14" rx="3" className="fill-white stroke-aura-outline" />
      <path d="M141 76v14" className="stroke-aura-outline" />

      {/* Tanaman */}
      <rect x="208" y="88" width="22" height="24" rx="4" className="fill-aura-primary" />
      <path d="M219 88c-10-8-14-22-8-34 10 6 12 20 8 34z" className="fill-aura-emerald" />
      <path d="M219 88c8-6 18-12 20-26-12 2-22 14-20 26z" className="fill-aura-emerald/70" />
    </svg>
  );
}
