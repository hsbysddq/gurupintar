import { BATAS_SETENGAH } from './konstanta';
import type { Kelompok } from './tipe';

/** Kelompok pemahaman satu siswa untuk satu sesi (PRD A-2, architecture.md 8.1). */
export function tentukanKelompok(skor: number, total: number): Kelompok {
  if (!Number.isInteger(skor) || !Number.isInteger(total)) {
    throw new Error('Skor dan total harus bilangan bulat.');
  }
  if (total <= 0) throw new Error('Total harus lebih dari 0.');
  if (skor < 0) throw new Error('Skor tidak boleh negatif.');
  if (skor > total) throw new Error('Skor tidak boleh melebihi total.');

  if (skor === total) return 'sudah';
  if (skor / total >= BATAS_SETENGAH) return 'setengah';
  return 'belum';
}
