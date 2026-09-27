'use client';

import { useCallback, useRef, useState } from 'react';
import { buatMateri, ErrorApi } from '@/lib/api-klien';
import type { MateriGuru } from '@/lib/tipe';

type OpsiBuat = { ganti?: boolean; gunakanCadangan?: boolean };

type Keadaan =
  | { status: 'diam' }
  | { status: 'menyusun' }
  /** 502: AI gagal atau waktu habis → tampilkan GagalBuatMateri (AC-6.3). */
  | { status: 'gagal-ai'; opsi: OpsiBuat }
  /** Error lain, misalnya 409 "Materi sedang dibuat. Tunggu sebentar." (AC-6.2). */
  | { status: 'ditolak'; pesan: string };

export type HasilBuatMateri = {
  keadaan: Keadaan;
  menyusun: boolean;
  buat: (opsi?: OpsiBuat) => Promise<void>;
  cobaLagi: () => void;
  gunakanCadangan: () => void;
  batal: () => void;
};

/**
 * Status dan aksi POST /api/guru/materi, dipakai di /guru/hasil dan /guru/materi.
 * Permintaan kedua diabaikan selama permintaan pertama berjalan (AC-6.2).
 */
export function useBuatMateri(sesiId: string | null, onBerhasil: (materi: MateriGuru[]) => void): HasilBuatMateri {
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: 'diam' });
  const berjalan = useRef(false);

  const buat = useCallback(
    async (opsi: OpsiBuat = {}) => {
      if (!sesiId || berjalan.current) return;
      berjalan.current = true;
      setKeadaan({ status: 'menyusun' });
      try {
        const materi = await buatMateri({ sesiId, ...opsi });
        setKeadaan({ status: 'diam' });
        onBerhasil(materi);
      } catch (err) {
        if (err instanceof ErrorApi && err.status === 502) {
          setKeadaan({ status: 'gagal-ai', opsi });
        } else {
          setKeadaan({ status: 'ditolak', pesan: err instanceof Error ? err.message : 'Materi belum berhasil dibuat.' });
        }
      } finally {
        berjalan.current = false;
      }
    },
    [sesiId, onBerhasil],
  );

  const opsiTerakhir = keadaan.status === 'gagal-ai' ? keadaan.opsi : {};

  return {
    keadaan,
    menyusun: keadaan.status === 'menyusun',
    buat,
    cobaLagi: () => void buat({ ...opsiTerakhir, gunakanCadangan: false }),
    gunakanCadangan: () => void buat({ ...opsiTerakhir, gunakanCadangan: true }),
    batal: () => setKeadaan({ status: 'diam' }),
  };
}
