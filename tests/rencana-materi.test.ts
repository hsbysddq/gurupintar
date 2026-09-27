import { describe, expect, it } from 'vitest';
import { miskonsepsiPerKelompok, tentukanTargetMateri } from '@/lib/rencana-materi';

describe('tentukanTargetMateri (architecture.md 7.3)', () => {
  const jumlah = { sudah: 5, setengah: 3, belum: 0 };

  it('menolak 400 jika belum ada jawaban di sesi', () => {
    const hasil = tentukanTargetMateri({ jumlahPerKelompok: { sudah: 0, setengah: 0, belum: 0 }, materi: [], ganti: false });
    expect(hasil).toMatchObject({ ok: false, status: 400 });
  });

  it('menolak 409 jika ganti dan ada materi dibagikan', () => {
    const hasil = tentukanTargetMateri({
      jumlahPerKelompok: jumlah,
      materi: [{ kelompok: 'sudah', status: 'draf' }, { kelompok: 'setengah', status: 'dibagikan' }],
      ganti: true,
    });
    expect(hasil).toEqual({ ok: false, status: 409, pesan: 'Materi yang sudah dibagikan tidak bisa dibuat ulang.' });
  });

  it('ganti dengan semua materi draf → semua kelompok berisi siswa', () => {
    const hasil = tentukanTargetMateri({
      jumlahPerKelompok: jumlah,
      materi: [{ kelompok: 'sudah', status: 'draf' }],
      ganti: true,
    });
    expect(hasil).toEqual({ ok: true, target: ['setengah', 'sudah'] });
  });

  it('ganti tanpa materi sama sekali → semua kelompok berisi siswa', () => {
    const hasil = tentukanTargetMateri({ jumlahPerKelompok: { sudah: 1, setengah: 1, belum: 1 }, materi: [], ganti: true });
    expect(hasil).toEqual({ ok: true, target: ['belum', 'setengah', 'sudah'] });
  });

  it('tanpa ganti → hanya kelompok berisi siswa yang belum punya materi', () => {
    const hasil = tentukanTargetMateri({
      jumlahPerKelompok: { sudah: 5, setengah: 3, belum: 2 },
      materi: [{ kelompok: 'sudah', status: 'dibagikan' }, { kelompok: 'setengah', status: 'draf' }],
      ganti: false,
    });
    expect(hasil).toEqual({ ok: true, target: ['belum'] });
  });

  it('tanpa ganti dan semua sudah punya materi → target kosong', () => {
    const hasil = tentukanTargetMateri({
      jumlahPerKelompok: jumlah,
      materi: [{ kelompok: 'sudah', status: 'dibagikan' }, { kelompok: 'setengah', status: 'dibagikan' }],
      ganti: false,
    });
    expect(hasil).toEqual({ ok: true, target: [] });
  });

  it('tidak pernah menargetkan kelompok tanpa siswa (AC-6.1)', () => {
    const hasil = tentukanTargetMateri({ jumlahPerKelompok: { sudah: 0, setengah: 0, belum: 4 }, materi: [], ganti: false });
    expect(hasil).toEqual({ ok: true, target: ['belum'] });
  });
});

describe('miskonsepsiPerKelompok', () => {
  const soal: { id: string; miskonsepsi: Record<string, string> }[] = [
    { id: 's1', miskonsepsi: { A: 'Menambah pembilang dan penyebut', C: 'Hanya mengalikan pembilang' } },
    { id: 's2', miskonsepsi: { B: 'Menambah pembilang dan penyebut', D: 'Membandingkan penyebut saja' } },
    { id: 's3', miskonsepsi: {} },
  ];

  it('mengurutkan miskonsepsi dari yang paling sering di tiap kelompok', () => {
    const hasil = miskonsepsiPerKelompok({
      hasil: [
        { siswaId: 'x', kelompok: 'belum' },
        { siswaId: 'y', kelompok: 'belum' },
        { siswaId: 'z', kelompok: 'setengah' },
      ],
      jawaban: [
        { siswaId: 'x', soalId: 's1', pilihan: 'C', benar: false },
        { siswaId: 'x', soalId: 's2', pilihan: 'B', benar: false },
        { siswaId: 'y', soalId: 's1', pilihan: 'A', benar: false },
        { siswaId: 'z', soalId: 's2', pilihan: 'D', benar: false },
      ],
      soal,
    });
    // Teks yang sama dari dua soal digabung hitungannya.
    expect(hasil.belum).toEqual(['Menambah pembilang dan penyebut', 'Hanya mengalikan pembilang']);
    expect(hasil.setengah).toEqual(['Membandingkan penyebut saja']);
    expect(hasil.sudah).toEqual([]);
  });

  it('mengabaikan jawaban benar, pilihan tanpa teks, dan siswa tanpa hasil', () => {
    const hasil = miskonsepsiPerKelompok({
      hasil: [{ siswaId: 'x', kelompok: 'setengah' }],
      jawaban: [
        { siswaId: 'x', soalId: 's1', pilihan: 'A', benar: true },
        { siswaId: 'x', soalId: 's3', pilihan: 'B', benar: false },
        { siswaId: 'asing', soalId: 's1', pilihan: 'C', benar: false },
      ],
      soal,
    });
    expect(hasil).toEqual({ sudah: [], setengah: [], belum: [] });
  });

  it('membatasi jumlah miskonsepsi; seri diurutkan abjad', () => {
    const banyak = [{ id: 's1', miskonsepsi: { A: 'Delta', B: 'Alfa', C: 'Charlie', D: 'Bravo' } }];
    const hasil = miskonsepsiPerKelompok(
      {
        hasil: [{ siswaId: 'x', kelompok: 'belum' }, { siswaId: 'y', kelompok: 'belum' }],
        jawaban: [
          { siswaId: 'x', soalId: 's1', pilihan: 'A', benar: false },
          { siswaId: 'y', soalId: 's1', pilihan: 'A', benar: false },
          { siswaId: 'x', soalId: 's1', pilihan: 'B', benar: false },
          { siswaId: 'x', soalId: 's1', pilihan: 'C', benar: false },
          { siswaId: 'x', soalId: 's1', pilihan: 'D', benar: false },
        ],
        soal: banyak,
      },
      3,
    );
    expect(hasil.belum).toEqual(['Delta', 'Alfa', 'Bravo']);
  });
});
