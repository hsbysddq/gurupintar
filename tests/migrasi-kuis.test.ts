import { describe, expect, it } from 'vitest';
import { perluMigrasiPercobaanKuis, perluMigrasiSoalTka } from '@/lib/server/soal-tka-db';

describe('perluMigrasiPercobaanKuis', () => {
  it('mengenali tabel percobaan_kuis yang belum dibuat', () => {
    expect(perluMigrasiPercobaanKuis({ message: 'relation "public.percobaan_kuis" does not exist' })).toBe(true);
    expect(
      perluMigrasiPercobaanKuis({
        message: "Could not find the table 'public.percobaan_kuis' in the schema cache",
      }),
    ).toBe(true);
  });

  it('mengenali fungsi simpan_hasil yang belum tersedia', () => {
    expect(perluMigrasiPercobaanKuis({ message: "Could not find the function public.simpan_hasil" })).toBe(true);
  });

  it('tidak menandai error lain sebagai masalah migrasi', () => {
    expect(perluMigrasiPercobaanKuis({ message: 'connection reset' })).toBe(false);
    expect(perluMigrasiPercobaanKuis({ message: 'Jawaban belum lengkap.' })).toBe(false);
    expect(perluMigrasiPercobaanKuis(null)).toBe(false);
  });
});

describe('perluMigrasiSoalTka', () => {
  it('tetap mengenali kolom soal TKA yang belum ada', () => {
    expect(perluMigrasiSoalTka({ message: 'column soal.tipe does not exist' })).toBe(true);
    expect(perluMigrasiSoalTka({ message: 'connection reset' })).toBe(false);
  });
});
