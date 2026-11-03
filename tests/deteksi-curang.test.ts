import { describe, expect, it } from 'vitest';
import {
  BATAS_PELANGGARAN,
  BLOKIR_KOSONG,
  bukaBlokirServer,
  tambahPelanggaranServer,
  CATATAN_KOSONG,
  JEDA_ABAIKAN_MS,
  catatPelanggaran,
  kunciPenyimpanan,
  pesanPeringatan,
  sisaKesempatan,
  terblokir,
  uraiCatatan,
} from '@/lib/deteksi-curang';

describe('catatPelanggaran', () => {
  it('pelanggaran pertama dicatat', () => {
    const { catatan, dicatat } = catatPelanggaran(CATATAN_KOSONG, 10_000);
    expect(dicatat).toBe(true);
    expect(catatan).toEqual({ jumlah: 1, terakhirPada: 10_000 });
  });

  it('kejadian yang berdekatan (visibilitychange lalu blur) dihitung sekali', () => {
    const satu = catatPelanggaran(CATATAN_KOSONG, 10_000).catatan;
    const dua = catatPelanggaran(satu, 10_000 + JEDA_ABAIKAN_MS - 1);
    expect(dua.dicatat).toBe(false);
    expect(dua.catatan.jumlah).toBe(1);
  });

  it('kejadian setelah jeda dihitung lagi', () => {
    const satu = catatPelanggaran(CATATAN_KOSONG, 10_000).catatan;
    const dua = catatPelanggaran(satu, 10_000 + JEDA_ABAIKAN_MS);
    expect(dua.dicatat).toBe(true);
    expect(dua.catatan.jumlah).toBe(2);
  });

  it('terblokir tepat pada batas dan tidak dihitung lagi setelahnya', () => {
    let catatan = CATATAN_KOSONG;
    for (let i = 1; i <= BATAS_PELANGGARAN; i++) {
      expect(terblokir(catatan)).toBe(false);
      catatan = catatPelanggaran(catatan, i * 10_000).catatan;
    }
    expect(terblokir(catatan)).toBe(true);
    const lagi = catatPelanggaran(catatan, 999_999);
    expect(lagi.dicatat).toBe(false);
    expect(lagi.catatan.jumlah).toBe(BATAS_PELANGGARAN);
  });
});

describe('sisaKesempatan dan pesanPeringatan', () => {
  it('sisa berkurang tiap pelanggaran dan tidak negatif', () => {
    expect(sisaKesempatan(CATATAN_KOSONG)).toBe(BATAS_PELANGGARAN);
    expect(sisaKesempatan({ jumlah: 1, terakhirPada: 1 })).toBe(BATAS_PELANGGARAN - 1);
    expect(sisaKesempatan({ jumlah: 99, terakhirPada: 1 })).toBe(0);
  });

  it('pesan menyebut nomor pelanggaran dan batas, tanpa label kelompok', () => {
    const pesan = pesanPeringatan({ jumlah: 1, terakhirPada: 1 });
    expect(pesan).toContain(`pelanggaran 1 dari ${BATAS_PELANGGARAN}`);
    expect(pesan).not.toMatch(/paham|kelompok/i);
  });
});

describe('uraiCatatan', () => {
  it('kosong atau rusak menjadi catatan kosong', () => {
    expect(uraiCatatan(null)).toEqual(CATATAN_KOSONG);
    expect(uraiCatatan('bukan json')).toEqual(CATATAN_KOSONG);
    expect(uraiCatatan('"teks"')).toEqual(CATATAN_KOSONG);
    expect(uraiCatatan('{"jumlah":-1}')).toEqual(CATATAN_KOSONG);
    expect(uraiCatatan('{"jumlah":1.5}')).toEqual(CATATAN_KOSONG);
  });

  it('membaca catatan yang valid dan membatasi jumlah pada batas', () => {
    expect(uraiCatatan('{"jumlah":2,"terakhirPada":123}')).toEqual({ jumlah: 2, terakhirPada: 123 });
    expect(uraiCatatan('{"jumlah":50,"terakhirPada":1}').jumlah).toBe(BATAS_PELANGGARAN);
  });
});

describe('kunciPenyimpanan', () => {
  it('terpisah untuk tiap kuis', () => {
    expect(kunciPenyimpanan('a')).not.toBe(kunciPenyimpanan('b'));
  });
});

describe('tambahPelanggaranServer', () => {
  it('pelanggaran pertama dan kedua belum memblokir', () => {
    const satu = tambahPelanggaranServer(null);
    expect(satu).toEqual({ keadaan: { jumlah: 1, terblokir: false, jumlahBlokir: 0 }, baruDiblokir: false });
    expect(tambahPelanggaranServer(satu.keadaan).keadaan).toEqual({ jumlah: 2, terblokir: false, jumlahBlokir: 0 });
  });

  it('pelanggaran pada batas memblokir dan menambah riwayat blokir sekali', () => {
    let keadaan = BLOKIR_KOSONG;
    for (let i = 1; i < BATAS_PELANGGARAN; i++) keadaan = tambahPelanggaranServer(keadaan).keadaan;
    const hasil = tambahPelanggaranServer(keadaan);
    expect(hasil.baruDiblokir).toBe(true);
    expect(hasil.keadaan).toEqual({ jumlah: BATAS_PELANGGARAN, terblokir: true, jumlahBlokir: 1 });
  });

  it('siswa yang sudah terblokir tidak bertambah lagi', () => {
    const terblokirSudah = { jumlah: BATAS_PELANGGARAN, terblokir: true, jumlahBlokir: 1 };
    const hasil = tambahPelanggaranServer(terblokirSudah);
    expect(hasil.baruDiblokir).toBe(false);
    expect(hasil.keadaan).toBe(terblokirSudah);
  });
});

describe('bukaBlokirServer', () => {
  it('mengembalikan hitungan ke nol dan menyimpan riwayat blokir', () => {
    expect(bukaBlokirServer({ jumlah: BATAS_PELANGGARAN, terblokir: true, jumlahBlokir: 1 })).toEqual({
      jumlah: 0,
      terblokir: false,
      jumlahBlokir: 1,
    });
  });

  it('blokir kedua setelah dibuka menambah riwayat menjadi 2', () => {
    let keadaan = bukaBlokirServer({ jumlah: BATAS_PELANGGARAN, terblokir: true, jumlahBlokir: 1 });
    for (let i = 0; i < BATAS_PELANGGARAN; i++) keadaan = tambahPelanggaranServer(keadaan).keadaan;
    expect(keadaan).toEqual({ jumlah: BATAS_PELANGGARAN, terblokir: true, jumlahBlokir: 2 });
  });
});
