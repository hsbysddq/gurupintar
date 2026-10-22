import type { Kelompok, StatusMateriSiswa } from './tipe';

/**
 * Status materi satu sesi untuk siswa.
 * `materi` hanya boleh berisi materi berstatus dibagikan.
 */
export function tentukanStatusMateriSiswa(
  hasil: { kelompok: Kelompok } | null | undefined,
  materi: { kelompok: Kelompok }[],
): StatusMateriSiswa {
  if (!hasil) return 'belum-mengerjakan';
  return materi.some((m) => m.kelompok === hasil.kelompok) ? 'tersedia' : 'disiapkan';
}
