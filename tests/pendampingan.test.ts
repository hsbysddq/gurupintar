import { describe, expect, it } from 'vitest';
import { BATAS_PAHAM, BATAS_SETENGAH, hitungPendampingan } from '@/lib/pendampingan';
import type { InputPendampingan, TindakanTersimpan } from '@/lib/pendampingan';
import type { DataPendampingan } from '@/lib/tipe';

const SESI: NonNullable<InputPendampingan['sesi']> = {
  id: 's1',
  dibuatPada: '2026-09-01T00:00:00Z',
};

type Opsi = {
  sesi?: InputPendampingan['sesi'];
  tindakan?: TindakanTersimpan[];
  total?: number;
};

/** Satu skor per siswa pada kuis terpilih; null = tidak mengerjakan. Total default 10. */
function buatData(skorPerSiswa: Record<string, number | null>, opsi: Opsi = {}) {
  const sesi = opsi.sesi === undefined ? SESI : opsi.sesi;
  const total = opsi.total ?? 10;
  const siswa = Object.keys(skorPerSiswa).map((nama) => ({ id: nama.toLowerCase(), nama }));
  const hasil = Object.entries(skorPerSiswa).flatMap(([nama, skor]) =>
    skor === null ? [] : [{ siswaId: nama.toLowerCase(), skor, total }],
  );
  return hitungPendampingan({ sesi, hasil, siswa, tindakan: opsi.tindakan });
}

function cari(data: DataPendampingan, nama: string) {
  const siswa = data.siswa.find((s) => s.nama === nama);
  if (!siswa) throw new Error(`Siswa ${nama} tidak ditemukan`);
  return siswa;
}

describe('kategori per hasil kuis', () => {
  it('memakai batas 70 paham, 50 setengah, di bawah 50 belum', () => {
    expect(BATAS_PAHAM).toBe(70);
    expect(BATAS_SETENGAH).toBe(50);

    const data = buatData({
      Ani: 7,
      Budi: 6,
      Citra: 5,
      Dodi: 4,
      Eka: null,
    });

    expect(cari(data, 'Ani')).toMatchObject({ kategori: 'paham', nilai: 70, status: 'paham' });
    expect(cari(data, 'Budi')).toMatchObject({ kategori: 'setengah', nilai: 60, status: 'menunggu' });
    expect(cari(data, 'Citra')).toMatchObject({ kategori: 'setengah', nilai: 50, status: 'menunggu' });
    expect(cari(data, 'Dodi')).toMatchObject({ kategori: 'belum', nilai: 40, status: 'pendampingan' });
    expect(cari(data, 'Eka')).toMatchObject({
      kategori: 'tidak-mengerjakan',
      nilai: null,
      status: 'pendampingan',
    });
  });

  it('memakai persentase skor/total, bukan jumlah soal mentah', () => {
    const data = buatData({ Ani: 2 }, { total: 3 });
    expect(cari(data, 'Ani')).toMatchObject({ kategori: 'setengah', nilai: 66.7 });
  });

  it('tidak membutuhkan 3 kuis; satu kuis cukup', () => {
    const data = buatData({ Ani: 7 });
    expect(cari(data, 'Ani')).toMatchObject({ kategori: 'paham', sesiId: 's1' });
  });

  it('tanpa kuis terpilih semua siswa belum punya kategori', () => {
    const data = buatData({ Ani: 7 }, { sesi: null });
    expect(cari(data, 'Ani')).toMatchObject({
      kategori: 'belum-cukup',
      nilai: null,
      status: 'belum-cukup',
      sesiId: null,
    });
    expect(data.ringkasan.sesiTerpilihId).toBeNull();
  });
});

describe('tindakan guru per kuis', () => {
  it('setengah paham tanpa keputusan menunggu guru', () => {
    expect(cari(buatData({ Ani: 6 }), 'Ani').status).toBe('menunggu');
  });

  it('setengah paham bisa diputuskan pendampingan atau evaluasi', () => {
    const pendampingan = buatData(
      { Ani: 6 },
      { tindakan: [{ siswaId: 'ani', sesiId: 's1', kategori: 'setengah', tindakan: 'pendampingan' }] },
    );
    const evaluasi = buatData(
      { Ani: 6 },
      { tindakan: [{ siswaId: 'ani', sesiId: 's1', kategori: 'setengah', tindakan: 'evaluasi' }] },
    );
    const selesai = buatData(
      { Ani: 6 },
      { tindakan: [{ siswaId: 'ani', sesiId: 's1', kategori: 'setengah', tindakan: 'selesai' }] },
    );
    expect(cari(pendampingan, 'Ani').status).toBe('pendampingan');
    expect(cari(evaluasi, 'Ani').status).toBe('evaluasi');
    expect(cari(selesai, 'Ani').status).toBe('selesai');
  });

  it('belum paham dan tidak mengerjakan langsung pendampingan, lalu bisa selesai', () => {
    const awal = buatData({ Ani: 4, Budi: null });
    expect(cari(awal, 'Ani').status).toBe('pendampingan');
    expect(cari(awal, 'Budi').status).toBe('pendampingan');

    const selesai = buatData(
      { Ani: 4, Budi: null },
      {
        tindakan: [
          { siswaId: 'ani', sesiId: 's1', kategori: 'belum', tindakan: 'selesai' },
          { siswaId: 'budi', sesiId: 's1', kategori: 'tidak-mengerjakan', tindakan: 'selesai' },
        ],
      },
    );
    expect(cari(selesai, 'Ani').status).toBe('selesai');
    expect(cari(selesai, 'Budi').status).toBe('selesai');
  });

  it('mengabaikan keputusan dari kuis lain atau kategori lama', () => {
    const sesiLama = buatData(
      { Ani: 6 },
      { tindakan: [{ siswaId: 'ani', sesiId: 's0', kategori: 'setengah', tindakan: 'pendampingan' }] },
    );
    const kategoriLama = buatData(
      { Ani: 6 },
      { tindakan: [{ siswaId: 'ani', sesiId: 's1', kategori: 'belum', tindakan: 'selesai' }] },
    );
    expect(cari(sesiLama, 'Ani').status).toBe('menunggu');
    expect(cari(kategoriLama, 'Ani').status).toBe('menunggu');
  });

  it('paham tidak memakai keputusan pendampingan', () => {
    const data = buatData(
      { Ani: 7 },
      { tindakan: [{ siswaId: 'ani', sesiId: 's1', kategori: 'setengah', tindakan: 'pendampingan' }] },
    );
    expect(cari(data, 'Ani').status).toBe('paham');
  });
});

describe('ringkasan', () => {
  it('menghitung jumlah kategori dan siswa yang menjawab', () => {
    const data = buatData({
      Ani: 7,
      Budi: 6,
      Citra: 4,
      Dodi: null,
    });
    expect(data.ringkasan).toMatchObject({
      jumlahSiswa: 4,
      jumlahMenjawab: 3,
      sesiTerpilihId: 's1',
      jumlahPaham: 1,
      jumlahSetengah: 1,
      jumlahBelum: 1,
      jumlahTidakMengerjakan: 1,
    });
  });
});
