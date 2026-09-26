import { describe, expect, it } from 'vitest';
import { kelompokkanHasil, pesanTanpaSoalTersulit, ringkasMateri } from '@/lib/ringkasan-hasil';
import type { Kelompok, SiswaHasil } from '@/lib/tipe';

const hasil = (siswaId: string, nama: string, skor: number, kelompok: Kelompok) => ({
  siswaId,
  nama,
  skor,
  total: 5,
  kelompok,
});

const siswa = (siswaId: string, nama: string, skor = 5): SiswaHasil => ({ siswaId, nama, skor, total: 5 });

describe('kelompokkanHasil', () => {
  it('mengembalikan tiga kelompok kosong jika belum ada hasil', () => {
    expect(kelompokkanHasil([])).toEqual({ sudah: [], setengah: [], belum: [] });
  });

  it('memasukkan setiap siswa ke kelompoknya tanpa properti kelompok', () => {
    const k = kelompokkanHasil([
      hasil('1', 'Budi', 5, 'sudah'),
      hasil('2', 'Citra', 3, 'setengah'),
      hasil('3', 'Dewi', 1, 'belum'),
    ]);
    expect(k).toEqual({
      sudah: [siswa('1', 'Budi', 5)],
      setengah: [siswa('2', 'Citra', 3)],
      belum: [siswa('3', 'Dewi', 1)],
    });
  });

  it('mengurutkan nama per kelompok sesuai abjad, tanpa membedakan huruf besar', () => {
    const k = kelompokkanHasil([
      hasil('1', 'Rizky', 1, 'belum'),
      hasil('2', 'agus', 0, 'belum'),
      hasil('3', 'Bayu', 2, 'belum'),
    ]);
    expect(k.belum.map((s) => s.nama)).toEqual(['agus', 'Bayu', 'Rizky']);
  });
});

describe('ringkasMateri', () => {
  const kelompok = {
    sudah: [siswa('1', 'Budi')],
    setengah: [siswa('2', 'Citra', 3)],
    belum: [] as SiswaHasil[],
  };

  it('belum-ada jika tidak ada materi; kelompok berisi siswa masuk kelompokTanpaMateri', () => {
    expect(ringkasMateri(kelompok, [])).toEqual({
      statusMateri: 'belum-ada',
      kelompokTanpaMateri: ['sudah', 'setengah'],
    });
  });

  it('draf jika semua materi masih draf', () => {
    const r = ringkasMateri(kelompok, [
      { kelompok: 'sudah', status: 'draf' },
      { kelompok: 'setengah', status: 'draf' },
    ]);
    expect(r).toEqual({ statusMateri: 'draf', kelompokTanpaMateri: [] });
  });

  it('dibagikan jika semua materi sudah dibagikan', () => {
    const r = ringkasMateri(kelompok, [
      { kelompok: 'sudah', status: 'dibagikan' },
      { kelompok: 'setengah', status: 'dibagikan' },
    ]);
    expect(r.statusMateri).toBe('dibagikan');
  });

  it('campuran jika ada draf dan dibagikan', () => {
    const r = ringkasMateri(kelompok, [
      { kelompok: 'sudah', status: 'dibagikan' },
      { kelompok: 'setengah', status: 'draf' },
    ]);
    expect(r.statusMateri).toBe('campuran');
  });

  it('kelompok kosong tidak masuk kelompokTanpaMateri', () => {
    const r = ringkasMateri(kelompok, [{ kelompok: 'sudah', status: 'dibagikan' }]);
    expect(r.kelompokTanpaMateri).toEqual(['setengah']);
  });

  it('materi untuk kelompok yang kini kosong tidak memengaruhi kelompokTanpaMateri', () => {
    const r = ringkasMateri(kelompok, [
      { kelompok: 'belum', status: 'draf' },
      { kelompok: 'sudah', status: 'draf' },
      { kelompok: 'setengah', status: 'draf' },
    ]);
    expect(r).toEqual({ statusMateri: 'draf', kelompokTanpaMateri: [] });
  });

  it('urutan kelompokTanpaMateri tetap: sudah, setengah, belum', () => {
    const semua = { sudah: [siswa('1', 'A')], setengah: [siswa('2', 'B', 3)], belum: [siswa('3', 'C', 0)] };
    expect(ringkasMateri(semua, []).kelompokTanpaMateri).toEqual(['sudah', 'setengah', 'belum']);
  });
});

describe('pesanTanpaSoalTersulit', () => {
  it('belum ada siswa yang menjawab', () => {
    expect(pesanTanpaSoalTersulit(0)).toBe('Belum ada jawaban masuk.');
  });

  it.each([1, 32])('ada %i siswa menjawab tetapi tanpa data jawaban per soal', (n) => {
    expect(pesanTanpaSoalTersulit(n)).toBe('Rincian jawaban per soal tidak tersedia untuk kuis ini.');
  });
});
