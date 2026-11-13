import { describe, expect, it } from 'vitest';
import {
  skemaBodyDaftarSuperAdmin,
  skemaBodyMulaiUjian,
  skemaBodySekolahBaru,
  skemaBodyUjianBaru,
} from '@/lib/skema-api';

const KELAS = '00000000-0000-4000-8000-000000000201';
const TOPIK = '00000000-0000-4000-8000-000000000301';
const SOAL = '00000000-0000-4000-8000-000000000401';

describe('skemaBodyUjianBaru', () => {
  const valid = {
    kelasId: KELAS,
    topikId: TOPIK,
    judul: 'Ujian Tengah Semester',
    mulaiPada: '2026-11-10T08:00:00.000Z',
    selesaiPada: '2026-11-10T10:00:00.000Z',
    durasiMenit: 60,
    soal: [{ soalId: SOAL, bobot: 25 }],
  };

  it('menerima ujian berbobot', () => {
    const hasil = skemaBodyUjianBaru.safeParse(valid);
    expect(hasil.success).toBe(true);
    if (hasil.success) {
      expect(hasil.data.soal[0].bobot).toBe(25);
    }
  });

  it('menolak bobot di luar 1–100 dan soal kosong', () => {
    expect(skemaBodyUjianBaru.safeParse({ ...valid, soal: [] }).success).toBe(false);
    expect(skemaBodyUjianBaru.safeParse({ ...valid, soal: [{ soalId: SOAL, bobot: 0 }] }).success).toBe(false);
    expect(skemaBodyUjianBaru.safeParse({ ...valid, soal: [{ soalId: SOAL, bobot: 101 }] }).success).toBe(false);
  });

  it('menolak durasi di luar batas', () => {
    expect(skemaBodyUjianBaru.safeParse({ ...valid, durasiMenit: 4 }).success).toBe(false);
    expect(skemaBodyUjianBaru.safeParse({ ...valid, durasiMenit: 301 }).success).toBe(false);
  });
});

describe('skemaBodyMulaiUjian', () => {
  it('menormalkan token menjadi kapital', () => {
    const hasil = skemaBodyMulaiUjian.parse({ ujianId: KELAS, token: ' abc123 ' });
    expect(hasil.token).toBe('ABC123');
  });

  it('menolak token pendek', () => {
    expect(skemaBodyMulaiUjian.safeParse({ ujianId: KELAS, token: 'ABC' }).success).toBe(false);
  });
});

describe('skemaBodyDaftarSuperAdmin', () => {
  it('menerima akun super-admin dengan kode undangan', () => {
    expect(
      skemaBodyDaftarSuperAdmin.safeParse({
        nama: 'Pengelola Platform',
        email: 'owner@example.com',
        password: 'rahasia123',
        kodeUndangan: 'UNDANGAN-RAHASIA',
      }).success,
    ).toBe(true);
  });

  it('menolak kata sandi pendek', () => {
    expect(
      skemaBodyDaftarSuperAdmin.safeParse({
        nama: 'Pengelola Platform',
        email: 'owner@example.com',
        password: 'pendek',
        kodeUndangan: 'UNDANGAN-RAHASIA',
      }).success,
    ).toBe(false);
  });
});

describe('skemaBodySekolahBaru', () => {
  it('menerima sekolah dan admin pertama', () => {
    const hasil = skemaBodySekolahBaru.safeParse({
      nama: 'SMP Nusantara',
      kode: 'smp-nusantara',
      namaAdmin: 'Bu Rina',
      emailAdmin: 'rina@example.com',
      sandiAdmin: 'rahasia123',
    });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.kode).toBe('SMP-NUSANTARA');
  });
});
