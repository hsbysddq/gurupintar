import type { Format } from './tipe';

/** Nilai pilihan bentuk materi dari database menjadi Format yang dikenal; nilai asing dianggap belum memilih. */
export function normalisasiFormat(nilai: unknown): Format | null {
  return nilai === 'video' || nilai === 'audio' || nilai === 'bacaan' || nilai === 'latihan' || nilai === 'ppt' ? nilai : null;
}
