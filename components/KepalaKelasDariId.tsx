'use client';

import { useEffect, useState } from 'react';
import { KepalaKelas } from '@/components/KepalaKelas';
import { ambilDaftarKelas } from '@/lib/api-klien';
import type { KelasRingkas } from '@/lib/tipe';

/** Menampilkan header + tab kelas di halaman yang hanya punya ?kelas= (hasil/materi). */
export function KepalaKelasDariId({ kelasId }: { kelasId: string | null }) {
  const [kelas, setKelas] = useState<KelasRingkas | null>(null);

  useEffect(() => {
    if (!kelasId) return;
    let batal = false;
    ambilDaftarKelas()
      .then((daftar) => {
        if (!batal) setKelas(daftar.find((k) => k.id === kelasId) ?? null);
      })
      .catch(() => {
        if (!batal) setKelas(null);
      });
    return () => {
      batal = true;
    };
  }, [kelasId]);

  if (!kelas) return null;
  return <KepalaKelas kelas={kelas} />;
}
