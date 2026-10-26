'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Memuat ulang data halaman server tiap `intervalMs`, hanya saat tab terlihat.
 * Menggantikan polling di halaman yang datanya dibaca di server (misalnya status kuis aktif).
 */
export function PerbaruiOtomatis({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
