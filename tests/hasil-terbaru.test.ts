import { describe, expect, it } from 'vitest';
import { pilihHasilTerbaru, type HasilRingkas } from '@/lib/hasil-terbaru';

const hasil = (siswaId: string, sesiId: string, skor: number): HasilRingkas => ({
  sesiId,
  siswaId,
  skor,
  total: 5,
  kelompok: skor === 5 ? 'sudah' : skor >= 3 ? 'setengah' : 'belum',
});

const urutan = new Map([
  ['s1', 0],
  ['s2', 1],
  ['s3', 2],
]);

describe('pilihHasilTerbaru', () => {
  it('memilih hasil dari sesi terbaru per siswa', () => {
    const peta = pilihHasilTerbaru(
      [hasil('andi', 's1', 1), hasil('andi', 's3', 5), hasil('budi', 's2', 3)],
      urutan,
    );
    expect(peta.get('andi')?.sesiId).toBe('s3');
    expect(peta.get('andi')?.skor).toBe(5);
    expect(peta.get('budi')?.sesiId).toBe('s2');
  });

  it('tidak bergantung pada urutan input', () => {
    const peta = pilihHasilTerbaru(
      [hasil('andi', 's3', 5), hasil('andi', 's1', 1), hasil('andi', 's2', 3)],
      urutan,
    );
    expect(peta.get('andi')?.sesiId).toBe('s3');
  });

  it('mengabaikan hasil dari sesi yang tidak dikenal', () => {
    const peta = pilihHasilTerbaru([hasil('andi', 's1', 1), hasil('andi', 's9', 5)], urutan);
    expect(peta.get('andi')?.sesiId).toBe('s1');
  });

  it('mengembalikan peta kosong untuk input kosong', () => {
    expect(pilihHasilTerbaru([], urutan).size).toBe(0);
  });
});
