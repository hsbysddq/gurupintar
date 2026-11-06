import { describe, expect, it } from 'vitest';
import { DAFTAR_GAYA_BACAAN, GAYA_BACAAN, INSTRUKSI_GAYA_BACAAN, ambilGayaBacaan } from '@/lib/gaya-bacaan';

describe('gaya bacaan', () => {
  it('menyediakan tiga gaya A–C dengan kode unik', () => {
    expect(DAFTAR_GAYA_BACAAN).toHaveLength(3);
    expect(DAFTAR_GAYA_BACAAN.map((gaya) => gaya.kode)).toEqual(['A', 'B', 'C']);
    expect(new Set(DAFTAR_GAYA_BACAAN.map((gaya) => gaya.id)).size).toBe(3);
  });

  it('memakai Ngobrol Santai sebagai fallback dan punya aturan untuk setiap gaya', () => {
    expect(ambilGayaBacaan('tidak-ada')).toBe(GAYA_BACAAN.santai);
    expect(ambilGayaBacaan('catatan').nama).toBe('Catatan Belajar');
    for (const gaya of DAFTAR_GAYA_BACAAN) {
      expect(INSTRUKSI_GAYA_BACAAN[gaya.id].length).toBeGreaterThan(50);
    }
  });
});
