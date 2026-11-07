import { describe, expect, it } from 'vitest';
import { normalisasiFormat } from '@/lib/format-materi';

describe('normalisasiFormat', () => {
  it('mengenali tiga format', () => {
    for (const f of ['video', 'audio', 'bacaan']) expect(normalisasiFormat(f)).toBe(f);
  });

  it('pilihan lama latihan dianggap belum memilih', () => {
    expect(normalisasiFormat('latihan')).toBeNull();
  });

  it('nilai kosong atau tidak dikenal menjadi null', () => {
    expect(normalisasiFormat(null)).toBeNull();
    expect(normalisasiFormat(undefined)).toBeNull();
    expect(normalisasiFormat('gambar')).toBeNull();
    expect(normalisasiFormat(3)).toBeNull();
  });
});
