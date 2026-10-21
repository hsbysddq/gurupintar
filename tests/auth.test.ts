import { describe, expect, it } from 'vitest';
import {
  cocokKodeUndangan,
  lanjutAman,
  normalisasiEmail,
  peranDariMetadata,
  tujuanSetelahMasuk,
} from '@/lib/auth';

describe('tujuanSetelahMasuk', () => {
  it('mengarahkan guru dan siswa ke areanya masing-masing', () => {
    expect(tujuanSetelahMasuk('guru')).toBe('/guru');
    expect(tujuanSetelahMasuk('siswa')).toBe('/siswa');
  });
});

describe('peranDariMetadata', () => {
  it('membaca peran dari app_metadata', () => {
    expect(peranDariMetadata({ peran: 'guru' })).toBe('guru');
    expect(peranDariMetadata({ peran: 'siswa' })).toBe('siswa');
  });

  it.each([null, undefined, {}, { peran: 'admin' }, { peran: 1 }, 'guru'])(
    'mengembalikan null untuk metadata tidak valid: %j',
    (meta) => {
      expect(peranDariMetadata(meta)).toBeNull();
    },
  );
});

describe('lanjutAman', () => {
  it('memakai tujuan bawaan jika kosong', () => {
    expect(lanjutAman(null, 'guru')).toBe('/guru');
    expect(lanjutAman(undefined, 'siswa')).toBe('/siswa');
    expect(lanjutAman('', 'guru')).toBe('/guru');
  });

  it('menerima path internal sesuai peran, termasuk query', () => {
    expect(lanjutAman('/siswa/kuis', 'siswa')).toBe('/siswa/kuis');
    expect(lanjutAman('/siswa?kode=A7K2P', 'siswa')).toBe('/siswa?kode=A7K2P');
    expect(lanjutAman('/guru/hasil?sesi=1', 'guru')).toBe('/guru/hasil?sesi=1');
  });

  it('menolak area peran lain', () => {
    expect(lanjutAman('/guru', 'siswa')).toBe('/siswa');
    expect(lanjutAman('/siswa/kuis', 'guru')).toBe('/guru');
  });

  it.each([
    '//evil.example',
    'https://evil.example',
    '/\\evil.example',
    '/siswa/../guru',
    'javascript:alert(1)',
    'siswa',
  ])('menolak tujuan berbahaya: %s', (tujuan) => {
    expect(lanjutAman(tujuan, 'siswa')).toBe('/siswa');
  });
});

describe('normalisasiEmail', () => {
  it('membuang spasi tepi dan mengecilkan huruf', () => {
    expect(normalisasiEmail('  Budi@Example.COM ')).toBe('budi@example.com');
  });
});

describe('cocokKodeUndangan', () => {
  it('menerima kode yang sama setelah spasi tepi dibuang', () => {
    expect(cocokKodeUndangan(' ABC123 ', 'ABC123')).toBe(true);
  });

  it('menolak kode berbeda, kosong, atau kode server belum diisi', () => {
    expect(cocokKodeUndangan('ABC124', 'ABC123')).toBe(false);
    expect(cocokKodeUndangan('', '')).toBe(false);
    expect(cocokKodeUndangan('ABC123', undefined)).toBe(false);
  });
});
