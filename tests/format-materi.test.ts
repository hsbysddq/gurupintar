import { describe, expect, it } from 'vitest';
import { normalisasiFormat } from '@/lib/format-materi';

describe('normalisasiFormat', () => {
  it('mengenali keempat format', () => {
    for (const f of ['ppt', 'audio', 'bacaan', 'latihan']) expect(normalisasiFormat(f)).toBe(f);
  });

  it('pilihan lama video terbaca sebagai ppt', () => {
    expect(normalisasiFormat('video')).toBe('ppt');
  });

  it('nilai kosong atau tidak dikenal menjadi null', () => {
    expect(normalisasiFormat(null)).toBeNull();
    expect(normalisasiFormat(undefined)).toBeNull();
    expect(normalisasiFormat('gambar')).toBeNull();
    expect(normalisasiFormat(3)).toBeNull();
  });
});
