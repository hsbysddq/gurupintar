import type { Kelompok } from './tipe';

export interface HasilRingkas {
  sesiId: string;
  siswaId: string;
  skor: number;
  total: number;
  kelompok: Kelompok;
}

/**
 * Memilih hasil terbaru per siswa berdasarkan urutan sesi.
 * `urutanSesi` lebih besar berarti sesi lebih baru. Hasil dari sesi yang tidak dikenal diabaikan.
 */
export function pilihHasilTerbaru(
  hasil: HasilRingkas[],
  urutanSesi: Map<string, number>,
): Map<string, HasilRingkas> {
  const terbaru = new Map<string, HasilRingkas>();

  for (const h of hasil) {
    const urutan = urutanSesi.get(h.sesiId);
    if (urutan === undefined) continue;

    const lama = terbaru.get(h.siswaId);
    const urutanLama = lama ? (urutanSesi.get(lama.sesiId) ?? -1) : -1;
    if (!lama || urutan > urutanLama) terbaru.set(h.siswaId, h);
  }

  return terbaru;
}
