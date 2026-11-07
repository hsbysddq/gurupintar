import type { Format } from './tipe';

/**
 * Nilai pilihan bentuk materi dari database menjadi Format yang dikenal.
 * Nilai lama yang tidak lagi ditawarkan (misalnya "latihan") dianggap belum memilih.
 */
export function normalisasiFormat(nilai: unknown): Format | null {
  return nilai === 'video' || nilai === 'audio' || nilai === 'bacaan' ? nilai : null;
}
