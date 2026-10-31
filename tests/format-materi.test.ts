import { describe, expect, it } from 'vitest';
import { normalisasiFormat } from '@/lib/format-materi';

describe('normalisasiFormat', () => {
  it('mengenali kelima format', () => {
    for (const f of ['video', 'audio', 'bacaan', 'latihan', 'ppt']) expect(normalisasiFormat(f)).toBe(f);
  });

  it('nilai kosong atau tidak dikenal menjadi null', () => {
    expect(normalisasiFormat(null)).toBeNull();
    expect(normalisasiFormat(undefined)).toBeNull();
    expect(normalisasiFormat('gambar')).toBeNull();
    expect(normalisasiFormat(3)).toBeNull();
  });
});
