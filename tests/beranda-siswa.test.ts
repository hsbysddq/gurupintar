import { describe, expect, it } from 'vitest';
import {
  hitungBeranda,
  hitungPersen,
  labelHari,
  namaDepan,
  type DataBeranda,
  type HasilBeranda,
} from '@/lib/beranda-siswa';

const KELAS = [
  { id: 'k1', nama: '8C', mapel: 'Matematika', namaGuru: 'Bu Rina' },
  { id: 'k2', nama: '8C', mapel: 'IPA', namaGuru: 'Pak Budi' },
  { id: 'k3', nama: '8A', mapel: 'matematika ', namaGuru: 'Bu Sari' },
];

function hasil(sesiId: string, kelompok: HasilBeranda['kelompok'], skor: number, tanggal: string): HasilBeranda {
  return { sesiId, kelompok, skor, total: 5, dikirimPada: tanggal, namaTopik: `Topik ${sesiId}` };
}

const DATA: DataBeranda = {
  kelas: KELAS,
  sesi: [
    { id: 's1', kelasId: 'k1' },
    { id: 's2', kelasId: 'k1' },
    { id: 's3', kelasId: 'k1' },
    { id: 's4', kelasId: 'k2' },
    { id: 's5', kelasId: 'k2' },
    { id: 's6', kelasId: 'k3' },
  ],
  hasil: [
    hasil('s1', 'sudah', 5, '2026-10-20T03:00:00Z'),
    hasil('s2', 'belum', 1, '2026-10-21T03:00:00Z'),
    hasil('s4', 'setengah', 3, '2026-10-22T03:00:00Z'),
  ],
};

describe('hitungPersen', () => {
  it('membulatkan dan mengembalikan 0 bila total 0', () => {
    expect(hitungPersen(42, 50)).toBe(84);
    expect(hitungPersen(1, 3)).toBe(33);
    expect(hitungPersen(0, 0)).toBe(0);
  });
});

describe('hitungBeranda', () => {
  it('semua angka 0 dan akurasi 0 bila siswa belum punya kelas', () => {
    const r = hitungBeranda({ kelas: [], sesi: [], hasil: [] });
    expect(r.totalMapel).toBe(0);
    expect(r.jumlahKelas).toBe(0);
    expect(r.totalMateri).toBe(0);
    expect(r.materi).toEqual({ belum: 0, sedang: 0, sudah: 0 });
    expect(r.soal).toEqual({ benar: 0, salah: 0, total: 0 });
    expect(r.akurasi).toBe(0);
    expect(r.kelas).toEqual([]);
    expect(r.aktivitas).toEqual([]);
  });

  it('belum paham = kelompok belum + kuis yang belum dikerjakan', () => {
    const r = hitungBeranda(DATA);
    expect(r.totalMateri).toBe(6);
    // belum: s2 (kelompok belum) + s3, s5, s6 (belum dikerjakan)
    expect(r.materi).toEqual({ belum: 4, sedang: 1, sudah: 1 });
    expect(r.materi.belum + r.materi.sedang + r.materi.sudah).toBe(r.totalMateri);
  });

  it('belum paham 0 bila semua kuis sudah dikerjakan dan tidak ada kelompok belum', () => {
    const r = hitungBeranda({
      kelas: [KELAS[0]],
      sesi: [{ id: 's1', kelasId: 'k1' }],
      hasil: [hasil('s1', 'sudah', 5, '2026-10-20T03:00:00Z')],
    });
    expect(r.materi).toEqual({ belum: 0, sedang: 0, sudah: 1 });
  });

  it('menjumlahkan soal benar dan salah dari skor dan total', () => {
    const r = hitungBeranda(DATA);
    expect(r.soal).toEqual({ benar: 9, salah: 6, total: 15 });
    expect(r.akurasi).toBe(60);
  });

  it('menghitung mapel berbeda tanpa peduli huruf besar dan spasi', () => {
    const r = hitungBeranda(DATA);
    expect(r.jumlahKelas).toBe(3);
    expect(r.totalMapel).toBe(2);
  });

  it('menghitung progres tiap kelas dan 0 bila kelas belum punya kuis', () => {
    const r = hitungBeranda({
      ...DATA,
      kelas: [...KELAS, { id: 'k4', nama: '7B', mapel: 'IPS', namaGuru: 'Bu Dewi' }],
    });
    const peta = new Map(r.kelas.map((k) => [k.id, k]));
    expect(peta.get('k1')).toMatchObject({ jumlahKuis: 3, dikerjakan: 2, progres: 67 });
    expect(peta.get('k2')).toMatchObject({ jumlahKuis: 2, dikerjakan: 1, progres: 50 });
    expect(peta.get('k3')).toMatchObject({ jumlahKuis: 1, dikerjakan: 0, progres: 0 });
    expect(peta.get('k4')).toMatchObject({ jumlahKuis: 0, dikerjakan: 0, progres: 0 });
  });

  it('memfilter satu kelas bila kelasId valid', () => {
    const r = hitungBeranda(DATA, 'k2');
    expect(r.kelasId).toBe('k2');
    expect(r.jumlahKelas).toBe(1);
    expect(r.totalMateri).toBe(2);
    expect(r.materi).toEqual({ belum: 1, sedang: 1, sudah: 0 });
    expect(r.soal).toEqual({ benar: 3, salah: 2, total: 5 });
    expect(r.akurasi).toBe(60);
    expect(r.kelas.map((k) => k.id)).toEqual(['k2']);
  });

  it('mengabaikan kelasId yang bukan kelas siswa', () => {
    const r = hitungBeranda(DATA, 'kelas-orang-lain');
    expect(r.kelasId).toBeNull();
    expect(r.jumlahKelas).toBe(3);
  });

  it('mengabaikan hasil dan sesi dari kelas yang tidak diikuti', () => {
    const r = hitungBeranda({
      kelas: [KELAS[0]],
      sesi: [
        { id: 's1', kelasId: 'k1' },
        { id: 'sx', kelasId: 'kx' },
      ],
      hasil: [hasil('s1', 'sudah', 4, '2026-10-20T03:00:00Z'), hasil('sx', 'sudah', 5, '2026-10-21T03:00:00Z')],
    });
    expect(r.totalMateri).toBe(1);
    expect(r.soal).toEqual({ benar: 4, salah: 1, total: 5 });
  });

  it('aktivitas terakhir diurutkan terbaru dahulu, maksimal 3, lengkap dengan mapel', () => {
    const r = hitungBeranda({
      ...DATA,
      hasil: [...DATA.hasil, hasil('s6', 'sudah', 5, '2026-10-23T03:00:00Z')],
    });
    expect(r.aktivitas.map((a) => a.sesiId)).toEqual(['s6', 's4', 's2']);
    expect(r.aktivitas[1]).toMatchObject({ namaTopik: 'Topik s4', mapel: 'IPA', skor: 3, total: 5 });
  });
});

describe('labelHari', () => {
  const sekarang = new Date('2026-10-24T17:30:00Z'); // 25 Okt 2026 00:30 WIB

  it('memakai hari menurut WIB, bukan UTC', () => {
    // 00:10 WIB tanggal 25 = hari ini.
    expect(labelHari('2026-10-24T17:10:00Z', sekarang)).toBe('Hari ini');
    // 23:00 WIB tanggal 24 = kemarin, walau di UTC masih tanggal yang sama dengan "sekarang".
    expect(labelHari('2026-10-24T16:00:00Z', sekarang)).toBe('Kemarin');
    expect(labelHari('2026-10-24T03:00:00Z', sekarang)).toBe('Kemarin');
    expect(labelHari('2026-10-23T03:00:00Z', sekarang)).not.toBe('Kemarin');
  });

  it('menampilkan tanggal pendek untuk hari yang lebih lama', () => {
    expect(labelHari('2026-10-20T03:00:00Z', sekarang)).toMatch(/20/);
  });
});

describe('namaDepan', () => {
  it('mengambil kata pertama', () => {
    expect(namaDepan('Lintang Buwono')).toBe('Lintang');
    expect(namaDepan('  Andi  ')).toBe('Andi');
    expect(namaDepan('')).toBe('');
  });
});
