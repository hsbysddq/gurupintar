import { describe, expect, it } from 'vitest';
import { KARAKTER_KODE, PANJANG_KODE } from '@/lib/konstanta';
import {
  adalahBentrokKode,
  buatKodeKelas,
  cobaDenganKodeBaru,
  MAKS_PERCOBAAN_KODE,
  type HasilPercobaan,
} from '@/lib/kode-kelas';

/** Mengembalikan nilai berurutan, lalu mengulang dari awal. */
function acakBerurutan(nilai: number[]): () => number {
  let i = 0;
  return () => nilai[i++ % nilai.length];
}

describe('buatKodeKelas', () => {
  it('menghasilkan kode sepanjang PANJANG_KODE', () => {
    expect(buatKodeKelas()).toHaveLength(PANJANG_KODE);
  });

  it('hanya memakai karakter dari KARAKTER_KODE (tanpa I, O, 0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      const kode = buatKodeKelas();
      for (const huruf of kode) expect(KARAKTER_KODE).toContain(huruf);
      expect(kode).not.toMatch(/[IO01]/);
    }
  });

  it('cocok dengan pola kode_kelas di database', () => {
    expect(buatKodeKelas()).toMatch(/^[A-Z0-9]{5,6}$/);
  });

  it('deterministik dengan fungsi acak tetap', () => {
    expect(buatKodeKelas(() => 0)).toBe('AAAAA');
    expect(buatKodeKelas(() => 0.9999)).toBe('99999');
  });

  it('memetakan setiap nilai acak ke karakter yang sesuai', () => {
    const n = KARAKTER_KODE.length;
    const acak = acakBerurutan([0, 1 / n, 2 / n, 8 / n, (n - 1) / n]);
    expect(buatKodeKelas(acak)).toBe(
      KARAKTER_KODE[0] + KARAKTER_KODE[1] + KARAKTER_KODE[2] + KARAKTER_KODE[8] + KARAKTER_KODE[n - 1],
    );
  });

  it('tetap aman jika fungsi acak mengembalikan 1', () => {
    expect(buatKodeKelas(() => 1)).toBe('99999');
  });
});

describe('adalahBentrokKode', () => {
  it('mengenali pelanggaran unique Postgres (23505)', () => {
    expect(adalahBentrokKode({ code: '23505', message: 'duplicate key' })).toBe(true);
  });

  it.each([null, undefined, 'teks', { code: '42P01' }, { message: '23505' }])(
    'bukan bentrok: %j',
    (err) => {
      expect(adalahBentrokKode(err)).toBe(false);
    },
  );
});

describe('cobaDenganKodeBaru', () => {
  const kodeBerurutan = () => {
    let i = 0;
    return () => `KODE${++i}`;
  };

  it('berhasil di percobaan pertama', async () => {
    const hasil = await cobaDenganKodeBaru(async (kode) => ({ status: 'berhasil', nilai: `id-${kode}` }), kodeBerurutan());
    expect(hasil).toEqual({ status: 'berhasil', nilai: 'id-KODE1', kode: 'KODE1' });
  });

  it('mencoba ulang dengan kode baru setelah bentrok', async () => {
    const dicoba: string[] = [];
    const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      dicoba.push(kode);
      return dicoba.length < 3 ? { status: 'bentrok' } : { status: 'berhasil', nilai: 'id-baru' };
    }, kodeBerurutan());
    expect(dicoba).toEqual(['KODE1', 'KODE2', 'KODE3']);
    expect(hasil).toEqual({ status: 'berhasil', nilai: 'id-baru', kode: 'KODE3' });
  });

  it(`berhenti setelah ${MAKS_PERCOBAAN_KODE} kali bentrok`, async () => {
    let jumlah = 0;
    const hasil = await cobaDenganKodeBaru(async () => {
      jumlah++;
      return { status: 'bentrok' };
    }, kodeBerurutan());
    expect(MAKS_PERCOBAAN_KODE).toBe(5);
    expect(jumlah).toBe(5);
    expect(hasil).toEqual({ status: 'habis' });
  });

  it('tidak mencoba ulang jika error bukan bentrok', async () => {
    let jumlah = 0;
    const error = new Error('koneksi putus');
    const hasil = await cobaDenganKodeBaru(async () => {
      jumlah++;
      return { status: 'gagal', error };
    }, kodeBerurutan());
    expect(jumlah).toBe(1);
    expect(hasil).toEqual({ status: 'gagal', error });
  });

  it('memakai buatKodeKelas secara bawaan', async () => {
    const hasil = await cobaDenganKodeBaru(async (kode) => ({ status: 'berhasil', nilai: kode }));
    expect(hasil.status).toBe('berhasil');
    if (hasil.status === 'berhasil') expect(hasil.kode).toMatch(/^[A-Z2-9]{5}$/);
  });
});
