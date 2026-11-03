import { describe, expect, it } from 'vitest';
import {
  normalisasiIsianSingkat,
  normalisasiPilganKompleks,
  periksaDanNilaiJawaban,
  rekonstruksiPasanganMenjodohkan,
  simpanKunciIsianSingkat,
  sudahTerjawabSoal,
  susunPilihanMenjodohkan,
  uraiPilganKompleks,
} from '@/lib/soal-tka';

describe('normalisasiPilganKompleks & uraiPilganKompleks', () => {
  it('mengurutkan dan membuang duplikat serta kode tidak valid', () => {
    expect(normalisasiPilganKompleks(['c', 'A', 'C', 'Z'])).toBe('A,C');
    expect(uraiPilganKompleks('D, B, B')).toEqual(['B', 'D']);
    expect(uraiPilganKompleks('')).toEqual([]);
  });
});

describe('normalisasiIsianSingkat', () => {
  it.each([
    [' 0,5 ', '0.5'],
    ['0.50', '0.5'],
    ['0,500', '0.5'],
    ['03', '3'],
    ['3,00', '3'],
    ['-0,0', '0'],
    [' 12,5   cm ', '12.5 cm'],
    ['Segitiga  Sama   Sisi', 'segitiga sama sisi'],
    ['1/2', '1/2'],
  ])('"%s" dinormalkan menjadi "%s"', (masuk, keluar) => {
    expect(normalisasiIsianSingkat(masuk)).toBe(keluar);
  });
});

describe('susunPilihanMenjodohkan & rekonstruksiPasanganMenjodohkan', () => {
  it('menyusun pasangan tanpa membocorkan urutan 1:A, 2:B dan dapat direkonstruksi kembali', () => {
    const asli = [
      { kiri: 'Luas segitiga', kanan: '½ × alas × tinggi' },
      { kiri: 'Luas persegi', kanan: 'sisi × sisi' },
      { kiri: 'Keliling persegi', kanan: '4 × sisi' },
    ];
    const { pilihan, kunci } = susunPilihanMenjodohkan(asli);
    expect(pilihan.kiri).toHaveLength(3);
    expect(pilihan.kanan).toHaveLength(3);
    expect(rekonstruksiPasanganMenjodohkan(pilihan, kunci)).toEqual(asli);
  });
});

describe('periksaDanNilaiJawaban (6 tipe soal)', () => {
  it('pilgan: hanya menerima A–D dan menilai tepat', () => {
    const soal = { tipe: 'pilgan' as const, pilihan: [], kunci: 'B' };
    expect(periksaDanNilaiJawaban(soal, 'B')).toEqual({
      valid: true,
      pilihanKanoni: 'B',
      benar: true,
      belumDinilai: false,
    });
    expect(periksaDanNilaiJawaban(soal, 'A').valid && periksaDanNilaiJawaban(soal, 'A')).toMatchObject({
      benar: false,
    });
    expect(periksaDanNilaiJawaban(soal, 'E')).toEqual({ valid: false });
  });

  it('pilgan_kompleks: penilaian semua-atau-nol, urutan centang bebas', () => {
    const soal = { tipe: 'pilgan_kompleks' as const, pilihan: [], kunci: 'A,C' };
    expect(periksaDanNilaiJawaban(soal, 'C,A')).toEqual({
      valid: true,
      pilihanKanoni: 'A,C',
      benar: true,
      belumDinilai: false,
    });
    // Hanya sebagian benar -> tetap salah (semua-atau-nol)
    expect(periksaDanNilaiJawaban(soal, 'A')).toEqual({
      valid: true,
      pilihanKanoni: 'A',
      benar: false,
      belumDinilai: false,
    });
    expect(periksaDanNilaiJawaban(soal, 'A,E')).toEqual({ valid: false });
  });

  it('benar_salah: wajib lengkap sesuai jumlah pernyataan dan semua-atau-nol', () => {
    const soal = {
      tipe: 'benar_salah' as const,
      pilihan: [
        { kode: '1', teks: 'P1' },
        { kode: '2', teks: 'P2' },
        { kode: '3', teks: 'P3' },
      ],
      kunci: 'B,S,B',
    };
    expect(periksaDanNilaiJawaban(soal, 'B,S,B')).toEqual({
      valid: true,
      pilihanKanoni: 'B,S,B',
      benar: true,
      belumDinilai: false,
    });
    expect(periksaDanNilaiJawaban(soal, 'B,S,S')).toEqual({
      valid: true,
      pilihanKanoni: 'B,S,S',
      benar: false,
      belumDinilai: false,
    });
    // Belum semua baris dijawab
    expect(periksaDanNilaiJawaban(soal, 'B,,B')).toEqual({ valid: false });
  });

  it('isian_singkat: mencocokkan beberapa variasi kunci termasuk koma/titik desimal', () => {
    const soal = {
      tipe: 'isian_singkat' as const,
      pilihan: [],
      kunci: simpanKunciIsianSingkat(['0,5', '1/2', 'setengah']),
    };
    for (const jwb of ['0.5', ' 0,50 ', '1/2', 'SETENGAH']) {
      const hasil = periksaDanNilaiJawaban(soal, jwb);
      expect(hasil).toMatchObject({ valid: true, benar: true, belumDinilai: false });
    }
    expect(periksaDanNilaiJawaban(soal, '0,25')).toMatchObject({ valid: true, benar: false });
  });

  it('menjodohkan: memvalidasi semua kode kiri dan menilai semua-atau-nol', () => {
    const { pilihan, kunci } = susunPilihanMenjodohkan([
      { kiri: '1/2', kanan: '0,5' },
      { kiri: '3/4', kanan: '0,75' },
    ]);
    const soal = { tipe: 'menjodohkan' as const, pilihan, kunci };
    expect(periksaDanNilaiJawaban(soal, kunci)).toEqual({
      valid: true,
      pilihanKanoni: kunci,
      benar: true,
      belumDinilai: false,
    });
    expect(periksaDanNilaiJawaban(soal, '1:A')).toEqual({ valid: false });
  });

  it('esai: ditandai belumDinilai = true dan benar = false sambil menunggu guru', () => {
    const soal = { tipe: 'esai' as const, pilihan: [], kunci: 'Luas = 24 cm²' };
    expect(periksaDanNilaiJawaban(soal, '  Luas segitiga adalah 1/2 x 8 x 6 = 24 cm2  ')).toEqual({
      valid: true,
      pilihanKanoni: 'Luas segitiga adalah 1/2 x 8 x 6 = 24 cm2',
      benar: false,
      belumDinilai: true,
    });
    expect(periksaDanNilaiJawaban(soal, '   ')).toEqual({ valid: false });
  });
});

describe('sudahTerjawabSoal', () => {
  it('memeriksa kelengkapan tiap tipe soal di UI siswa', () => {
    expect(sudahTerjawabSoal({ tipe: 'pilgan', pilihan: [] }, 'A')).toBe(true);
    expect(sudahTerjawabSoal({ tipe: 'pilgan', pilihan: [] }, '')).toBe(false);
    expect(sudahTerjawabSoal({ tipe: 'pilgan_kompleks', pilihan: [] }, 'B')).toBe(true);
    expect(
      sudahTerjawabSoal(
        {
          tipe: 'benar_salah',
          pilihan: [
            { kode: '1', teks: 'X' },
            { kode: '2', teks: 'Y' },
          ],
        },
        'B,',
      ),
    ).toBe(false);
    expect(
      sudahTerjawabSoal(
        {
          tipe: 'benar_salah',
          pilihan: [
            { kode: '1', teks: 'X' },
            { kode: '2', teks: 'Y' },
          ],
        },
        'B,S',
      ),
    ).toBe(true);
    expect(sudahTerjawabSoal({ tipe: 'isian_singkat', pilihan: [] }, '  ')).toBe(false);
    expect(sudahTerjawabSoal({ tipe: 'isian_singkat', pilihan: [] }, '24')).toBe(true);
    expect(sudahTerjawabSoal({ tipe: 'esai', pilihan: [] }, 'Uraian lengkap')).toBe(true);
  });
});

