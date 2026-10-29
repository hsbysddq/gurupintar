import type { Format } from './tipe';

/**
 * Nilai pilihan bentuk materi dari database menjadi Format yang dikenal.
 * Pilihan lama "video" sudah diganti PPT, jadi data lama otomatis terbaca sebagai "ppt".
 */
export function normalisasiFormat(nilai: unknown): Format | null {
  if (nilai === 'video') return 'ppt';
  return nilai === 'ppt' || nilai === 'audio' || nilai === 'bacaan' || nilai === 'latihan' ? nilai : null;
}
