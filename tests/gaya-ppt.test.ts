import { describe, expect, it } from 'vitest';
import { DAFTAR_GAYA_PPT, GAYA_PPT, ambilGayaPpt, hexCss } from '@/lib/gaya-ppt';

describe('gaya PPT', () => {
  it('menyediakan lima gaya A–E dengan kode unik', () => {
    expect(DAFTAR_GAYA_PPT).toHaveLength(5);
    expect(DAFTAR_GAYA_PPT.map((g) => g.kode)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(new Set(DAFTAR_GAYA_PPT.map((g) => g.id)).size).toBe(5);
  });

  it('memakai warna hex yang valid dan fallback ke editorial', () => {
    for (const gaya of DAFTAR_GAYA_PPT) {
      for (const warna of [gaya.latar, gaya.kertas, gaya.teks, gaya.muted, gaya.aksen, gaya.aksenTeks]) {
        expect(warna).toMatch(/^[0-9A-F]{6}$/i);
      }
    }
    expect(ambilGayaPpt('tidak-ada')).toBe(GAYA_PPT.editorial);
    expect(hexCss('1A1A1A')).toBe('#1A1A1A');
  });
});
