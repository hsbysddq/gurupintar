import { describe, expect, it } from 'vitest';
import { tentukanKelompok } from '@/lib/pengelompokan';

describe('tentukanKelompok (total 5)', () => {
  it.each([
    [5, 'sudah'],
    [4, 'setengah'],
    [3, 'setengah'],
    [2, 'belum'],
    [0, 'belum'],
  ] as const)('skor %i → %s', (skor, kelompok) => {
    expect(tentukanKelompok(skor, 5)).toBe(kelompok);
  });
});

describe('tentukanKelompok input tidak valid', () => {
  it('melempar error jika total 0', () => {
    expect(() => tentukanKelompok(0, 0)).toThrow(Error);
  });

  it('melempar error jika total negatif', () => {
    expect(() => tentukanKelompok(0, -5)).toThrow(Error);
  });

  it('melempar error jika skor negatif', () => {
    expect(() => tentukanKelompok(-1, 5)).toThrow(Error);
  });

  it('melempar error jika skor lebih besar dari total', () => {
    expect(() => tentukanKelompok(6, 5)).toThrow(Error);
  });

  it('melempar error jika skor bukan bilangan bulat', () => {
    expect(() => tentukanKelompok(2.5, 5)).toThrow(Error);
  });

  it('melempar error jika total bukan bilangan bulat', () => {
    expect(() => tentukanKelompok(2, 5.5)).toThrow(Error);
  });
});
