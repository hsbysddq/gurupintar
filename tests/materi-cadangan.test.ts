import { describe, expect, it } from 'vitest';
import dataCadangan from '@/data/materi-cadangan.json';
import { ambilMateriCadangan } from '@/lib/server/materi-cadangan';

describe('ambilMateriCadangan', () => {
  it.each(['belum', 'setengah', 'sudah'] as const)('mengembalikan materi cadangan %s', (kelompok) => {
    expect(ambilMateriCadangan(kelompok)).toEqual(dataCadangan[kelompok]);
  });

  it('materi tiap kelompok berbeda', () => {
    const judul = new Set((['belum', 'setengah', 'sudah'] as const).map((k) => ambilMateriCadangan(k).judul));
    expect(judul.size).toBe(3);
  });
});
