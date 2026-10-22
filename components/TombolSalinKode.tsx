'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function TombolSalinKode({ kode }: { kode: string }) {
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    if (!tersalin) return;
    const waktu = setTimeout(() => setTersalin(false), 2000);
    return () => clearTimeout(waktu);
  }, [tersalin]);

  async function salin() {
    try {
      await navigator.clipboard.writeText(kode);
      setTersalin(true);
    } catch {
      // Clipboard bisa diblokir browser; kode tetap terlihat di layar.
    }
  }

  return (
    <button
      type="button"
      onClick={salin}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/80 px-3 text-[13px] font-semibold text-primer transition-colors hover:bg-primer-lembut"
    >
      {tersalin ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
      <span aria-live="polite">{tersalin ? 'Tersalin' : 'Salin kode'}</span>
    </button>
  );
}
