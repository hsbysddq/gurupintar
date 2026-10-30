import { describe, expect, it } from 'vitest';
import { BATAS_PAHAM, BATAS_SETENGAH, hitungPendampingan, JUMLAH_KUIS } from '@/lib/pendampingan';
import type { InputPendampingan, TindakanTersimpan } from '@/lib/pendampingan';
import type { DataPendampingan, StatusSesi } from '@/lib/tipe';

const SESI: InputPendampingan['sesi'] = [
  { id: 's1', status: 'selesai', dibuatPada: '2026-09-01T00:00:00Z' },
  { id: 's2', status: 'selesai', dibuatPada: '2026-09-08T00:00:00Z' },
  { id: 's3', status: 'selesai', dibuatPada: '2026-09-15T00:00:00Z' },
];

type Opsi = {
  sesi?: { id: string; status: StatusSesi; dibuatPada: string }[];
  tindakan?: TindakanTersimpan[];
  total?: number;
};

/** Skor per sesi; null = tidak mengerjakan. Total default 10 agar batas 70/50 mudah diuji. */
function buatData(skorPerSiswa: Record<string, (number | null)[]>, opsi: Opsi = {}) {
  const sesi = opsi.sesi ?? SESI;
  const total = opsi.total ?? 10;
  const siswa = Object.keys(skorPerSiswa).map((nama) => ({ id: nama.toLowerCase(), nama }));
  const hasil = Object.entries(skorPerSiswa).flatMap(([nama, daftar]) =>
    daftar.flatMap((skor, i) =>
      skor === null || i >= sesi.length
        ? []
        : [{ siswaId: nama.toLowerCase(), sesiId: sesi[i].id, skor, total }],
    ),
  );
  return hitungPendampingan({ sesi, hasil, siswa, tindakan: opsi.tindakan });
}

function cari(data: DataPendampingan, nama: string) {
  const siswa = data.siswa.find((s) => s.nama === nama);
  if (!siswa) throw new Error(`Siswa ${nama} tidak ditemukan`);
  return siswa;
}

describe('kategori rata-rata', () => {
  it('memakai batas 70 paham, 50 setengah, di bawah 50 belum', () => {
    expect(BATAS_PAHAM).toBe(70);
    expect(BATAS_SETENGAH).toBe(50);
    expect(JUMLAH_KUIS).toBe(3);

    const data = buatData({
      Ani: [7, 7, 7],
      Budi: [6, 7, 7],
      Citra: [6, 6, 7],
      Dodi: [5, 5, 5],
      Eka: [4, 5, 5],
    });

    expect(cari(data, 'Ani')).toMatchObject({ kategori: 'paham', rataRata: 70, status: 'paham' });
    expect(cari(data, 'Budi')).toMatchObject({ kategori: 'setengah', rataRata: 66.7, status: 'menunggu' });
    expect(cari(data, 'Citra')).toMatchObject({ kategori: 'setengah', rataRata: 63.3, status: 'menunggu' });
    expect(cari(data, 'Dodi')).toMatchObject({ kategori: 'setengah', rataRata: 50, status: 'menunggu' });
    expect(cari(data, 'Eka')).toMatchObject({ kategori: 'belum', rataRata: 46.7, status: 'pendampingan' });
  });

  it('memakai persentase tiap kuis, bukan jumlah soal mentah', () => {
    const data = hitungPendampingan({
      sesi: SESI,
      hasil: [
        { siswaId: 'ani', sesiId: 's1', skor: 5, total: 5 },
        { siswaId: 'ani', sesiId: 's2', skor: 4, total: 5 },
        { siswaId: 'ani', sesiId: 's3', skor: 3, total: 5 },
      ],
      siswa: [{ id: 'ani', nama: 'Ani' }],
    });
    expect(cari(data, 'Ani')).toMatchObject({ kategori: 'paham', rataRata: 80 });
  });

  it('siswa dengan kurang dari 3 hasil masuk tidak mengerjakan', () => {
    // Citra mengerjakan ketiga kuis agar sesi s3 tetap masuk jendela, meskipun Ani melewatkannya.
    const data = buatData({ Ani: [7, 7, null], Budi: [null, null, null], Citra: [7, 7, 7] });
    expect(cari(data, 'Ani')).toMatchObject({
      kategori: 'tidak-mengerjakan',
      rataRata: null,
      jumlahDikerjakan: 2,
      jumlahKuis: 3,
      status: 'pendampingan',
    });
    expect(cari(data, 'Budi')).toMatchObject({ kategori: 'tidak-mengerjakan', jumlahDikerjakan: 0 });
  });

  it('hanya memakai 3 kuis selesai terakhir; sesi aktif diabaikan', () => {
    const sesi = [
      ...SESI,
      { id: 's4', status: 'aktif' as const, dibuatPada: '2026-09-22T00:00:00Z' },
    ];
    // Budi mengerjakan s1 agar sesi itu tidak terbuang sebagai sesi tanpa jawaban.
    const data = buatData({ Ani: [null, 7, 7, 7], Budi: [7, 7, 7, 7] }, { sesi });
    expect(cari(data, 'Ani')).toMatchObject({
      kategori: 'tidak-mengerjakan',
      jumlahDikerjakan: 2,
      sesiTerakhirId: 's3',
    });
  });

  it('kuis selesai tanpa jawaban tidak menggeser 3 kuis terakhir', () => {
    const sesi = [
      ...SESI,
      { id: 'kosong', status: 'selesai' as const, dibuatPada: '2026-09-22T00:00:00Z' },
    ];
    const data = buatData({ Ani: [7, 7, 7] }, { sesi });
    expect(cari(data, 'Ani')).toMatchObject({ kategori: 'paham', jumlahDikerjakan: 3 });
    expect(data.ringkasan.jumlahSesiSelesai).toBe(3);
  });

  it('belum cukup data bila kuis selesai kurang dari 3', () => {
    const data = buatData({ Ani: [7, 7] }, { sesi: SESI.slice(0, 2) });
    expect(cari(data, 'Ani')).toMatchObject({
      kategori: 'belum-cukup',
      rataRata: null,
      jumlahKuis: 2,
      status: 'belum-cukup',
    });
    expect(data.ringkasan).toMatchObject({
      jumlahSesiSelesai: 2,
      butuhSesi: 1,
      jumlahPaham: 0,
      jumlahSetengah: 0,
      jumlahBelum: 0,
      jumlahTidakMengerjakan: 0,
    });
  });
});

describe('tindakan guru', () => {
  const setengah = [6, 6, 6];
  const belum = [4, 4, 4];
  const tidak = [5, null, null];

  it('setengah paham tanpa keputusan menunggu guru', () => {
    expect(cari(buatData({ Ani: setengah }), 'Ani').status).toBe('menunggu');
  });

  it('setengah paham bisa diputuskan pendampingan atau evaluasi', () => {
    const pendampingan = buatData(
      { Ani: setengah },
      { tindakan: [{ siswaId: 'ani', sesiTerakhirId: 's3', kategori: 'setengah', tindakan: 'pendampingan' }] },
    );
    const evaluasi = buatData(
      { Ani: setengah },
      { tindakan: [{ siswaId: 'ani', sesiTerakhirId: 's3', kategori: 'setengah', tindakan: 'evaluasi' }] },
    );
    const selesai = buatData(
      { Ani: setengah },
      { tindakan: [{ siswaId: 'ani', sesiTerakhirId: 's3', kategori: 'setengah', tindakan: 'selesai' }] },
    );
    expect(cari(pendampingan, 'Ani').status).toBe('pendampingan');
    expect(cari(evaluasi, 'Ani').status).toBe('evaluasi');
    expect(cari(selesai, 'Ani').status).toBe('selesai');
  });

  it('belum paham dan tidak mengerjakan langsung pendampingan, lalu bisa selesai', () => {
    const awal = buatData({ Ani: belum, Budi: tidak });
    expect(cari(awal, 'Ani').status).toBe('pendampingan');
    expect(cari(awal, 'Budi').status).toBe('pendampingan');

    const selesai = buatData(
      { Ani: belum, Budi: tidak },
      {
        tindakan: [
          { siswaId: 'ani', sesiTerakhirId: 's3', kategori: 'belum', tindakan: 'selesai' },
          { siswaId: 'budi', sesiTerakhirId: 's3', kategori: 'tidak-mengerjakan', tindakan: 'selesai' },
        ],
      },
    );
    expect(cari(selesai, 'Ani').status).toBe('selesai');
    expect(cari(selesai, 'Budi').status).toBe('selesai');
  });

  it('mengabaikan keputusan lama bila sesi terakhir atau kategori berubah', () => {
    const sesiLama = buatData(
      { Ani: setengah },
      { tindakan: [{ siswaId: 'ani', sesiTerakhirId: 's2', kategori: 'setengah', tindakan: 'pendampingan' }] },
    );
    const kategoriLama = buatData(
      { Ani: setengah },
      { tindakan: [{ siswaId: 'ani', sesiTerakhirId: 's3', kategori: 'belum', tindakan: 'selesai' }] },
    );
    expect(cari(sesiLama, 'Ani').status).toBe('menunggu');
    expect(cari(kategoriLama, 'Ani').status).toBe('menunggu');
  });

  it('paham tidak memakai keputusan pendampingan', () => {
    const data = buatData(
      { Ani: [7, 7, 7] },
      { tindakan: [{ siswaId: 'ani', sesiTerakhirId: 's3', kategori: 'setengah', tindakan: 'pendampingan' }] },
    );
    expect(cari(data, 'Ani').status).toBe('paham');
  });
});

describe('ringkasan', () => {
  it('menghitung jumlah kategori dan sesi berjawaban', () => {
    const data = buatData({
      Ani: [7, 7, 7],
      Budi: [6, 6, 6],
      Citra: [4, 4, 4],
      Dodi: [5, null, null],
    });
    expect(data.ringkasan).toMatchObject({
      jumlahSiswa: 4,
      jumlahSesi: 3,
      jumlahSesiSelesai: 3,
      jumlahSesiBerjawaban: 3,
      butuhSesi: 0,
      jumlahPaham: 1,
      jumlahSetengah: 1,
      jumlahBelum: 1,
      jumlahTidakMengerjakan: 1,
    });
  });
});
