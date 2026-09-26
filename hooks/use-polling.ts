'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorApi } from '@/lib/api-klien';

const PESAN_GAGAL_MEMUAT = 'Data belum berhasil dimuat. Coba lagi sebentar.';

type Keadaan<T> = {
  /** Fungsi pengambil yang menghasilkan keadaan ini; keadaan milik fungsi lama diabaikan. */
  sumber: unknown;
  data?: T;
  galat: string | null;
};

export type HasilPolling<T> = {
  data: T | undefined;
  /** Pesan galat terakhir; data sebelumnya tetap ada jika pernah berhasil. */
  galat: string | null;
  /** `true` sampai permintaan pertama selesai (berhasil atau gagal). */
  memuat: boolean;
  /** Mengambil data sekarang tanpa menunggu interval berikutnya. */
  muatUlang: () => void;
};

/**
 * Mengambil data berulang setiap `intervalMs` (architecture.md 7.2 dan 7.4).
 * - Permintaan sebelumnya dibatalkan dengan `AbortController` sebelum yang baru dikirim.
 * - Jadwal berikutnya dibuat setelah respons datang, sehingga permintaan tidak menumpuk.
 * - Berhenti saat tab tidak terlihat (`document.hidden`) dan langsung mengambil lagi saat terlihat.
 *
 * `ambil` harus stabil (bungkus dengan `useCallback`); `null` berarti belum ada yang perlu diambil.
 */
export function usePolling<T>(
  ambil: ((signal: AbortSignal) => Promise<T>) | null,
  intervalMs: number,
): HasilPolling<T> {
  const [keadaan, setKeadaan] = useState<Keadaan<T>>({ sumber: null, galat: null });
  const pemicu = useRef<() => void>(() => {});

  useEffect(() => {
    if (!ambil) return;
    let pengendali: AbortController | null = null;
    let jadwal: ReturnType<typeof setTimeout> | undefined;

    const berhenti = () => {
      clearTimeout(jadwal);
      pengendali?.abort();
      pengendali = null;
    };

    const jalankan = async () => {
      berhenti();
      if (document.hidden) return;
      const ini = new AbortController();
      pengendali = ini;

      try {
        const data = await ambil(ini.signal);
        if (ini.signal.aborted) return;
        setKeadaan({ sumber: ambil, data, galat: null });
      } catch (err) {
        if (ini.signal.aborted) return;
        const pesan = err instanceof ErrorApi ? err.message : PESAN_GAGAL_MEMUAT;
        setKeadaan((lama) => ({ sumber: ambil, data: lama.sumber === ambil ? lama.data : undefined, galat: pesan }));
      }
      jadwal = setTimeout(jalankan, intervalMs);
    };

    const saatVisibilitasBerubah = () => {
      if (document.hidden) berhenti();
      else void jalankan();
    };

    pemicu.current = () => void jalankan();
    document.addEventListener('visibilitychange', saatVisibilitasBerubah);
    void jalankan();

    return () => {
      document.removeEventListener('visibilitychange', saatVisibilitasBerubah);
      pemicu.current = () => {};
      berhenti();
    };
  }, [ambil, intervalMs]);

  const muatUlang = useCallback(() => pemicu.current(), []);
  const milikIni = ambil !== null && keadaan.sumber === ambil;

  return {
    data: milikIni ? keadaan.data : undefined,
    galat: milikIni ? keadaan.galat : null,
    memuat: ambil !== null && !milikIni,
    muatUlang,
  };
}
