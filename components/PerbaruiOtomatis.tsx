'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Memuat ulang data halaman server tiap `intervalMs`, hanya saat tab terlihat.
 * Menggantikan polling di halaman yang datanya dibaca di server (misalnya status kuis aktif).
 * Saat tab kembali terlihat, data langsung dimuat ulang tanpa menunggu interval berikutnya.
 */
export function PerbaruiOtomatis({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, intervalMs);
    function saatTerlihat() {
      if (!document.hidden) router.refresh();
    }
    document.addEventListener('visibilitychange', saatTerlihat);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', saatTerlihat);
    };
  }, [router, intervalMs]);

  return null;
}
