import { describe, expect, it } from 'vitest';
import {
  normalisasiKode,
  skemaBodyFormat,
  skemaBodyJawaban,
  skemaQuerySesi,
  skemaQuerySoal,
} from '@/lib/skema-api';

const SISWA_ID = '00000000-0000-4000-8000-000000000201';
const SESI_ID = '00000000-0000-4000-8000-000000000100';
const SOAL_ID = '00000000-0000-4000-8000-000000000301';

describe('normalisasiKode', () => {
  it('mengubah ke huruf kapital dan menghapus spasi', () => {
    expect(normalisasiKode(' a7k 2p ')).toBe('A7K2P');
  });
});

describe('skemaQuerySesi', () => {
  it('menerima kode yang ditulis kecil dengan spasi', () => {
    expect(skemaQuerySesi.parse({ kode: 'a7k 2p' })).toEqual({ kode: 'A7K2P' });
  });

  it('menerima kode riwayat 6 karakter', () => {
    expect(skemaQuerySesi.safeParse({ kode: 'RIW001' }).success).toBe(true);
  });

  it.each(['', 'A7K', 'A7K2P99', 'A7-2P'])('menolak kode tidak valid: "%s"', (kode) => {
    expect(skemaQuerySesi.safeParse({ kode }).success).toBe(false);
  });

  it('menolak jika kode tidak ada', () => {
    expect(skemaQuerySesi.safeParse({}).success).toBe(false);
  });
});

describe('skemaQuerySoal', () => {
  it('menerima uuid', () => {
    expect(skemaQuerySoal.safeParse({ sesi: SESI_ID }).success).toBe(true);
  });

  it('menolak bukan uuid', () => {
    expect(skemaQuerySoal.safeParse({ sesi: 'abc' }).success).toBe(false);
  });
});

describe('skemaBodyFormat', () => {
  it.each(['video', 'audio', 'bacaan', 'latihan'])('menerima format %s', (format) => {
    expect(skemaBodyFormat.safeParse({ siswaId: SISWA_ID, format }).success).toBe(true);
  });

  it('menolak format lain', () => {
    expect(skemaBodyFormat.safeParse({ siswaId: SISWA_ID, format: 'visual' }).success).toBe(false);
  });
});

describe('skemaBodyJawaban', () => {
  const valid = { sesiId: SESI_ID, siswaId: SISWA_ID, jawaban: [{ soalId: SOAL_ID, pilihan: 'B' }] };

  it('menerima body yang valid', () => {
    expect(skemaBodyJawaban.safeParse(valid).success).toBe(true);
  });

  it('menolak jawaban kosong', () => {
    expect(skemaBodyJawaban.safeParse({ ...valid, jawaban: [] }).success).toBe(false);
  });

  it('menolak pilihan di luar A–D', () => {
    const body = { ...valid, jawaban: [{ soalId: SOAL_ID, pilihan: 'E' }] };
    expect(skemaBodyJawaban.safeParse(body).success).toBe(false);
  });

  it('tidak meneruskan field tambahan seperti benar dari browser', () => {
    const body = { ...valid, jawaban: [{ soalId: SOAL_ID, pilihan: 'B', benar: true }] };
    const hasil = skemaBodyJawaban.parse(body);
    expect(hasil.jawaban[0]).toEqual({ soalId: SOAL_ID, pilihan: 'B' });
  });
});
