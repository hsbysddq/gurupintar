'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { ErrorApi, ubahKelas } from '@/lib/api-klien';

export function PulihkanKelas({ id }: { id: string }) {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function pulihkan() {
    setMemuat(true);
    setGalat(null);
    try {
      await ubahKelas({ id, arsip: false });
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil dipulihkan.');
      setMemuat(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Tombol varian="sekunder" ikon={RotateCcw} memuat={memuat} onClick={pulihkan}>
        Pulihkan
      </Tombol>
      {galat && (
        <p role="alert" className="text-[12px] leading-normal font-medium text-belum-teks">
          {galat}
        </p>
      )}
    </div>
  );
}
