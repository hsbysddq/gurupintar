import { describe, expect, it } from 'vitest';
import {
  hitungBatasPeserta,
  hitungNilaiUjian,
  normalisasiTokenUjian,
  statusUjianEfektif,
  tokenUjianValid,
} from '@/lib/ujian';

describe('token ujian', () => {
  it('menormalkan token menjadi kapital tanpa spasi', () => {
    expect(normalisasiTokenUjian(' ab c-123 ')).toBe('ABC123');
  });

  it('menerima 6–10 karakter alfanumerik', () => {
    expect(tokenUjianValid('ABC123')).toBe(true);
    expect(tokenUjianValid('ABCDEFGHIJ')).toBe(true);
    expect(tokenUjianValid('ABC12')).toBe(false);
    expect(tokenUjianValid('ABC-12')).toBe(false);
  });
});

describe('statusUjianEfektif', () => {
  const sekarang = new Date('2026-11-10T10:00:00.000Z');

  it('terjadwal sebelum waktu buka', () => {
    expect(statusUjianEfektif('terjadwal', '2026-11-10T11:00:00.000Z', '2026-11-10T12:00:00.000Z', sekarang)).toBe('terjadwal');
  });

  it('aktif di dalam jendela', () => {
    expect(statusUjianEfektif('aktif', '2026-11-10T09:00:00.000Z', '2026-11-10T11:00:00.000Z', sekarang)).toBe('aktif');
  });

  it('selesai setelah waktu tutup', () => {
    expect(statusUjianEfektif('aktif', '2026-11-10T08:00:00.000Z', '2026-11-10T09:00:00.000Z', sekarang)).toBe('selesai');
  });

  it('draf tetap draf', () => {
    expect(statusUjianEfektif('draf', '2026-11-10T09:00:00.000Z', '2026-11-10T11:00:00.000Z', sekarang)).toBe('draf');
  });
});

describe('hitungBatasPeserta', () => {
  it('memakai durasi pribadi jika masih di dalam jendela ujian', () => {
    expect(
      hitungBatasPeserta('2026-11-10T09:00:00.000Z', 60, '2026-11-10T12:00:00.000Z'),
    ).toBe('2026-11-10T10:00:00.000Z');
  });

  it('tidak melewati jam tutup ujian', () => {
    expect(
      hitungBatasPeserta('2026-11-10T09:30:00.000Z', 60, '2026-11-10T10:00:00.000Z'),
    ).toBe('2026-11-10T10:00:00.000Z');
  });
});

describe('hitungNilaiUjian', () => {
  const soal = [
    { id: 's1', tipe: 'pilgan' as const, pilihan: [], kunci: 'B', bobot: 10 },
    { id: 's2', tipe: 'pilgan_kompleks' as const, pilihan: [], kunci: 'A,C', bobot: 20 },
    { id: 's3', tipe: 'esai' as const, pilihan: [], kunci: 'pedoman', bobot: 30 },
  ];

  it('menjumlahkan bobot soal', () => {
    const hasil = hitungNilaiUjian(soal, []);
    expect(hasil.total).toBe(60);
    expect(hasil.skor).toBe(0);
    expect(hasil.belumDinilai).toBe(1);
  });

  it('menilai pilihan ganda, kompleks, dan esai berbobot', () => {
    const hasil = hitungNilaiUjian(soal, [
      { soalId: 's1', jawaban: 'B' },
      { soalId: 's2', jawaban: 'C,A' },
      { soalId: 's3', jawaban: 'Jawaban esai', benar: true },
    ]);
    expect(hasil.skor).toBe(60);
    expect(hasil.persen).toBe(100);
    expect(hasil.belumDinilai).toBe(0);
  });

  it('pilihan ganda kompleks harus sama persis', () => {
    const hasil = hitungNilaiUjian(soal, [{ soalId: 's2', jawaban: 'A' }]);
    expect(hasil.skor).toBe(0);
  });

  it('esai yang belum dinilai tidak menambah skor', () => {
    const hasil = hitungNilaiUjian(soal, [
      { soalId: 's1', jawaban: 'B' },
      { soalId: 's3', jawaban: 'Jawaban esai' },
    ]);
    expect(hasil.skor).toBe(10);
    expect(hasil.belumDinilai).toBe(1);
  });
});
