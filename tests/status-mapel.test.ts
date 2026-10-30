import { describe, expect, it } from 'vitest';
import { hitungStatusMapel, infoStatusMapel, susunPerformaMapel, type HasilMapel, type SesiMapel } from '@/lib/status-mapel';
import type { RiwayatKuis } from '@/lib/riwayat-siswa';

const sesi = (id: string, hari: number): SesiMapel => ({ sesiId: id, dibuatPada: `2026-10-${String(hari).padStart(2, '0')}T03:00:00Z` });
const hasil = (id: string, skor: number, jam = 5, total = 10): HasilMapel => ({
  sesiId: id,
  skor,
  total,
  dikirimPada: `2026-10-20T0${jam}:00:00Z`,
});
const TIGA = [sesi('a', 1), sesi('b', 2), sesi('c', 3)];

describe('hitungStatusMapel', () => {
  it('belum cukup data bila pengerjaan kurang dari 3', () => {
    expect(hitungStatusMapel(TIGA, [hasil('a', 9), hasil('b', 9)])).toEqual({ status: 'belum-cukup', rataRata: null, dikerjakan: 2 });
    expect(hitungStatusMapel([sesi('a', 1)], [])).toMatchObject({ status: 'belum-cukup' });
  });

  it('tidak mengerjakan bila mapel sudah punya 3 kuis tetapi tidak ada yang dikerjakan', () => {
    expect(hitungStatusMapel(TIGA, [])).toEqual({ status: 'tidak-mengerjakan', rataRata: null, dikerjakan: 0 });
  });

  it('aman pada rata-rata 70 ke atas (batas tepat 70)', () => {
    expect(hitungStatusMapel(TIGA, [hasil('a', 7), hasil('b', 7), hasil('c', 7)])).toMatchObject({ status: 'aman', rataRata: 70 });
  });

  it('batas aman pada 50 sampai di bawah 70, termasuk rentang 60-69', () => {
    expect(hitungStatusMapel(TIGA, [hasil('a', 5), hasil('b', 5), hasil('c', 5)])).toMatchObject({ status: 'batas-aman', rataRata: 50 });
    expect(hitungStatusMapel(TIGA, [hasil('a', 6), hasil('b', 7), hasil('c', 6)])).toMatchObject({ status: 'batas-aman', rataRata: 63 });
  });

  it('tidak aman di bawah 50', () => {
    expect(hitungStatusMapel(TIGA, [hasil('a', 4), hasil('b', 5), hasil('c', 4)])).toMatchObject({ status: 'tidak-aman', rataRata: 43 });
  });

  it('hanya 3 pengerjaan terakhir yang dihitung', () => {
    const h = [hasil('a', 0, 1), hasil('a', 0, 2), hasil('a', 9, 3), hasil('b', 9, 4), hasil('c', 9, 5)];
    expect(hitungStatusMapel(TIGA, h)).toMatchObject({ status: 'aman', rataRata: 90, dikerjakan: 3 });
  });

  it('mengerjakan ulang satu kuis 3 kali sudah cukup untuk status', () => {
    const h = [hasil('a', 4, 1), hasil('a', 6, 2), hasil('a', 8, 3)];
    expect(hitungStatusMapel([sesi('a', 1)], h)).toMatchObject({ status: 'batas-aman', rataRata: 60, dikerjakan: 3 });
  });
});

describe('infoStatusMapel', () => {
  it('tidak memakai label kelompok', () => {
    for (const s of ['aman', 'batas-aman', 'tidak-aman', 'tidak-mengerjakan', 'belum-cukup'] as const) {
      const { label, pesan } = infoStatusMapel(s);
      expect(`${label} ${pesan}`).not.toMatch(/paham|kelompok/i);
    }
  });
});

describe('susunPerformaMapel', () => {
  const riwayat = (kelasId: string, id: string): RiwayatKuis => ({
    sesiId: id,
    kelasId,
    dikirimPada: '2026-10-20T05:00:00Z',
    namaKelas: 'Kelas 8A',
    namaTopik: 'T',
    skor: 4,
    total: 5,
  });

  it('memisahkan riwayat per mapel dan mengurutkan menurut nama mapel', () => {
    const hasilSusun = susunPerformaMapel(
      [
        { kelasId: 'k2', namaMapel: 'Matematika', namaKelas: 'Kelas 8A', sesi: [sesi('s2', 1)] },
        { kelasId: 'k1', namaMapel: 'Bahasa Indonesia', namaKelas: 'Kelas 8A', sesi: [sesi('s1', 1)] },
      ],
      [riwayat('k1', 's1'), riwayat('k2', 's2'), riwayat('k2', 's2')],
    );
    expect(hasilSusun.map((m) => m.namaMapel)).toEqual(['Bahasa Indonesia', 'Matematika']);
    expect(hasilSusun[0].riwayat).toHaveLength(1);
    expect(hasilSusun[1].riwayat).toHaveLength(2);
  });

  it('menyembunyikan mapel yang belum punya kuis sama sekali', () => {
    expect(susunPerformaMapel([{ kelasId: 'k', namaMapel: 'IPA', namaKelas: 'Kelas 7', sesi: [] }], [])).toEqual([]);
  });
});
