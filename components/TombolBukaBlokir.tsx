'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LockOpen } from 'lucide-react';
import { bukaBlokirSiswa, ErrorApi } from '@/lib/api-klien';

/** Tombol guru untuk membuka blokir siswa pada satu kuis langsung dari tab Siswa. */
export function TombolBukaBlokir({ sesiId, siswaId }: { sesiId: string; siswaId: string }) {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function buka() {
    setMemuat(true);
    setGalat(null);
    try {
      await bukaBlokirSiswa({ sesiId, siswaId });
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Blokir belum berhasil dibuka. Coba lagi sebentar.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void buka()}
        disabled={memuat}
        aria-busy={memuat || undefined}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-belum-teks/30 bg-white px-3 text-[12px] leading-normal font-bold text-belum-teks hover:bg-white/80 disabled:opacity-60"
      >
        {memuat ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        ) : (
          <LockOpen aria-hidden="true" className="size-3.5" />
        )}
        {memuat ? 'Membuka…' : 'Buka blokir'}
      </button>
      {galat && (
        <span role="alert" className="text-[12px] leading-normal font-medium text-belum-teks">
          {galat}
        </span>
      )}
    </span>
  );
}

