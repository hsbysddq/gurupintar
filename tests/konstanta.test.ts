import { describe, expect, it } from 'vitest';
import { KARAKTER_KODE, PANJANG_KODE } from '@/lib/konstanta';

describe('KARAKTER_KODE', () => {
  it.each(['I', 'O', '0', '1'])('tidak memuat karakter yang mudah tertukar: %s', (karakter) => {
    expect(KARAKTER_KODE).not.toContain(karakter);
  });

  it('hanya berisi huruf kapital dan angka tanpa duplikat', () => {
    expect(KARAKTER_KODE).toMatch(/^[A-Z0-9]+$/);
    expect(new Set(KARAKTER_KODE).size).toBe(KARAKTER_KODE.length);
  });
});

describe('PANJANG_KODE', () => {
  it('bernilai 5 sesuai PRD AC-4.2', () => {
    expect(PANJANG_KODE).toBe(5);
  });
});
