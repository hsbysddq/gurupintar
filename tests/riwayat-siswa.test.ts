import { describe, expect, it } from 'vitest';
import { hitungPersen, kalimatTren, ringkasPerforma, titikGrafik, urutkanLama, type RiwayatKuis } from '@/lib/riwayat-siswa';

const kuis = (id: string, tanggal: string, skor: number, total = 5): RiwayatKuis => ({
  sesiId: id,
  dikirimPada: tanggal,
  namaKelas: 'Kelas 7A',
  namaTopik: `Topik ${id}`,
  skor,
  total,
});

describe('hitungPersen', () => {
  it('membulatkan ke persen terdekat', () => {
    expect(hitungPersen(1, 5)).toBe(20);
    expect(hitungPersen(2, 3)).toBe(67);
    expect(hitungPersen(5, 5)).toBe(100);
  });
  it('0 jika total tidak valid', () => {
    expect(hitungPersen(3, 0)).toBe(0);
  });
});

describe('ringkasPerforma', () => {
  it('kosong jika belum ada kuis', () => {
    expect(ringkasPerforma([])).toEqual({ jumlahKuis: 0, rataRata: null, terbaik: null, perubahan: null });
  });

  it('satu kuis: tanpa perubahan', () => {
    expect(ringkasPerforma([kuis('a', '2026-10-01T08:00:00Z', 3)])).toEqual({
      jumlahKuis: 1,
      rataRata: 60,
      terbaik: 60,
      perubahan: null,
    });
  });

  it('menghitung rata-rata, terbaik, dan perubahan dari dua kuis terakhir (urutan input bebas)', () => {
    const daftar = [kuis('c', '2026-10-20T08:00:00Z', 4), kuis('a', '2026-10-01T08:00:00Z', 1), kuis('b', '2026-10-10T08:00:00Z', 5)];
    // persen urut waktu: 20, 100, 80
    expect(ringkasPerforma(daftar)).toEqual({ jumlahKuis: 3, rataRata: 67, terbaik: 100, perubahan: -20 });
  });
});

describe('urutkanLama dan titikGrafik', () => {
  it('mengurutkan dari terlama dan tidak mengubah array asli', () => {
    const daftar = [kuis('b', '2026-10-10T08:00:00Z', 2), kuis('a', '2026-10-01T08:00:00Z', 1)];
    expect(urutkanLama(daftar).map((k) => k.sesiId)).toEqual(['a', 'b']);
    expect(daftar.map((k) => k.sesiId)).toEqual(['b', 'a']);
  });

  it('membuat titik grafik berisi persen, judul, dan skor', () => {
    const titik = titikGrafik([kuis('a', '2026-10-01T08:00:00Z', 4)]);
    expect(titik).toHaveLength(1);
    expect(titik[0]).toMatchObject({ persen: 80, judul: 'Topik a', skor: 4, total: 5 });
  });
});

describe('kalimatTren', () => {
  it('netral dan tanpa label kelompok', () => {
    for (const p of [null, 20, -20, 0]) {
      expect(kalimatTren(p)).not.toMatch(/paham|kelompok/i);
    }
  });
  it('menyebut arah perubahan', () => {
    expect(kalimatTren(20)).toContain('Naik 20');
    expect(kalimatTren(-40)).toContain('Turun 40');
    expect(kalimatTren(0)).toContain('sama');
    expect(kalimatTren(null)).toContain('satu kuis lagi');
  });
});
