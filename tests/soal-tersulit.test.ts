import { describe, expect, it } from 'vitest';
import { cariSoalTersulit } from '@/lib/soal-tersulit';

type Soal = { id: string; nomor: number; teks: string; miskonsepsi: Record<string, string> };

const SOAL: Soal[] = [
  { id: 's1', nomor: 1, teks: 'Soal satu', miskonsepsi: { A: 'Salah paham A1', C: 'Salah paham C1' } },
  { id: 's2', nomor: 2, teks: 'Soal dua', miskonsepsi: { B: 'Salah paham B2', D: 'Salah paham D2' } },
  { id: 's3', nomor: 3, teks: 'Soal tiga', miskonsepsi: {} },
];

type Jawaban = { soalId: string; pilihan: string; benar: boolean };

const benar = (soalId: string): Jawaban => ({ soalId, pilihan: 'X', benar: true });
const salah = (soalId: string, pilihan: string): Jawaban => ({ soalId, pilihan, benar: false });

describe('cariSoalTersulit', () => {
  it('mengembalikan null jika tidak ada jawaban', () => {
    expect(cariSoalTersulit(SOAL, [])).toBeNull();
  });

  it('mengembalikan null jika tidak ada jawaban yang cocok dengan soal', () => {
    expect(cariSoalTersulit(SOAL, [salah('lain', 'A')])).toBeNull();
  });

  it('memilih soal dengan persentase salah tertinggi', () => {
    const hasil = cariSoalTersulit(SOAL, [
      salah('s1', 'A'), benar('s1'), benar('s1'),
      salah('s2', 'B'), salah('s2', 'B'), benar('s2'),
      benar('s3'), benar('s3'), benar('s3'),
    ]);
    expect(hasil).toEqual({ nomor: 2, teks: 'Soal dua', persenSalah: 67, miskonsepsi: 'Salah paham B2' });
  });

  it('memakai persentase, bukan jumlah salah mentah', () => {
    // s1: 2 salah dari 4 (50%); s2: 1 salah dari 1 (100%)
    const hasil = cariSoalTersulit(SOAL, [
      salah('s1', 'A'), salah('s1', 'A'), benar('s1'), benar('s1'),
      salah('s2', 'D'),
    ]);
    expect(hasil?.nomor).toBe(2);
    expect(hasil?.persenSalah).toBe(100);
  });

  it('jika seri, memilih nomor terkecil', () => {
    const hasil = cariSoalTersulit(SOAL, [
      benar('s2'), salah('s2', 'B'),
      salah('s1', 'C'), benar('s1'),
    ]);
    expect(hasil?.nomor).toBe(1);
    expect(hasil?.persenSalah).toBe(50);
  });

  it('seri tetap memilih nomor terkecil walau urutan soal masukan acak', () => {
    const soalAcak = [SOAL[2], SOAL[1], SOAL[0]];
    const hasil = cariSoalTersulit(soalAcak, [salah('s3', 'A'), salah('s2', 'B'), salah('s1', 'A')]);
    expect(hasil?.nomor).toBe(1);
  });

  it('membulatkan persentase ke bilangan bulat', () => {
    // 1 dari 3 = 33,33%
    const hasil = cariSoalTersulit(SOAL, [salah('s1', 'A'), benar('s1'), benar('s1')]);
    expect(hasil?.persenSalah).toBe(33);
  });

  it('mengambil miskonsepsi dari pilihan salah yang paling sering dipilih', () => {
    const hasil = cariSoalTersulit(SOAL, [salah('s1', 'A'), salah('s1', 'C'), salah('s1', 'C')]);
    expect(hasil?.miskonsepsi).toBe('Salah paham C1');
  });

  it('jika pilihan salah seri, memakai kode abjad terkecil', () => {
    const hasil = cariSoalTersulit(SOAL, [salah('s2', 'D'), salah('s2', 'B')]);
    expect(hasil?.miskonsepsi).toBe('Salah paham B2');
  });

  it('miskonsepsi null jika pilihan salah terbanyak tidak punya teks', () => {
    const hasil = cariSoalTersulit(SOAL, [salah('s3', 'A')]);
    expect(hasil).toEqual({ nomor: 3, teks: 'Soal tiga', persenSalah: 100, miskonsepsi: null });
  });

  it('jika semua benar, persenSalah 0 dan miskonsepsi null', () => {
    const hasil = cariSoalTersulit(SOAL, [benar('s1'), benar('s2'), benar('s3')]);
    expect(hasil).toEqual({ nomor: 1, teks: 'Soal satu', persenSalah: 0, miskonsepsi: null });
  });
});
