import { describe, expect, it } from 'vitest';
import { tentukanKelompok } from '@/lib/pengelompokan';
import {
  ALASAN_BELUM_PAHAM,
  ALASAN_MENURUN,
  ALASAN_TIDAK_MENGERJAKAN,
  hitungPendampingan,
  SARAN_BELUM_PAHAM,
  SARAN_MENURUN,
  SARAN_TIDAK_MENGERJAKAN,
  trenMenurun,
} from '@/lib/pendampingan';

type Input = Parameters<typeof hitungPendampingan>[0];

// PRD 8.2
const NAMA = [
  'Andi Saputra', 'Budi Santoso', 'Citra Lestari', 'Dimas Saputra', 'Eka Putri', 'Fajar Nugroho', 'Gita Permata',
  'Hendra Wijaya', 'Intan Maharani', 'Joko Prasetyo', 'Kartika Sari', 'Lukman Hakim', 'Maya Anggraini', 'Nanda Pratiwi',
  'Oki Ramadhan', 'Putri Ayu', 'Rizky Pratama', 'Salsa Nabila', 'Sari Wulandari', 'Taufik Hidayat', 'Umi Kalsum',
  'Vina Oktaviani', 'Wahyu Setiawan', 'Yoga Aditya', 'Zahra Aulia', 'Bayu Firmansyah', 'Dewi Kurnia', 'Farhan Maulana',
  'Laras Ningrum', 'Nadia Safitri', 'Reza Kurniawan', 'Tiara Anjani',
  // 8 siswa baru tanpa riwayat RIW001–RIW003.
  'Hana Pertiwi', 'Jihan Amalia', 'Kevin Prasetyo', 'Mira Handayani', 'Gilang Ramadhan', 'Ilham Kurniawan',
  'Lestari Wulan', 'Naufal Rizki',
];

const idSiswa = (nama: string) => `siswa-${nama.toLowerCase().replace(/\s+/g, '-')}`;

// PRD 8.5, RIW001–RIW003; `null` = tidak menjawab.
const SKOR_KHUSUS: Record<string, (number | null)[]> = {
  'Budi Santoso': [1, 2, 1],
  'Sari Wulandari': [3, null, null],
  'Rizky Pratama': [5, 4, 3],
  'Dimas Saputra': [1, 2, 4],
};
const SKOR_LAIN = [5, 4, 5];
const SKOR_SISWA_BARU = [null, null, null];
const SISWA_BARU = NAMA.slice(32);

// PRD 8.5, tabel Sesi 4 (RIW004). Sari Wulandari dan Dimas Saputra tidak menjawab.
const KELOMPOK_RIW004: [number, string[]][] = [
  [5, ['Andi Saputra', 'Citra Lestari', 'Gita Permata', 'Intan Maharani', 'Kartika Sari', 'Maya Anggraini',
    'Salsa Nabila', 'Zahra Aulia', 'Hana Pertiwi', 'Jihan Amalia']],
  [4, ['Eka Putri', 'Fajar Nugroho', 'Lukman Hakim', 'Putri Ayu', 'Vina Oktaviani', 'Laras Ningrum']],
  [3, ['Hendra Wijaya', 'Nanda Pratiwi', 'Taufik Hidayat', 'Dewi Kurnia', 'Nadia Safitri', 'Kevin Prasetyo']],
  [2, ['Rizky Pratama', 'Joko Prasetyo', 'Oki Ramadhan', 'Umi Kalsum', 'Reza Kurniawan', 'Mira Handayani']],
  [1, ['Budi Santoso', 'Wahyu Setiawan', 'Yoga Aditya', 'Bayu Firmansyah', 'Farhan Maulana', 'Gilang Ramadhan']],
  [0, ['Tiara Anjani', 'Ilham Kurniawan', 'Lestari Wulan', 'Naufal Rizki']],
];
const SKOR_RIW004 = new Map(KELOMPOK_RIW004.flatMap(([skor, daftar]) => daftar.map((nama) => [nama, skor] as const)));

/** Data sesuai seed.sql: RIW001–RIW004 selesai + A7K2P aktif tanpa jawaban. */
function dataPrd(): Input {
  const sesi: Input['sesi'] = [
    { id: 'riw001', status: 'selesai', dibuatPada: '2026-09-07T01:00:00Z' },
    { id: 'riw002', status: 'selesai', dibuatPada: '2026-09-14T01:00:00Z' },
    { id: 'riw003', status: 'selesai', dibuatPada: '2026-09-21T01:00:00Z' },
    { id: 'riw004', status: 'selesai', dibuatPada: '2026-09-26T01:00:00Z' },
    { id: 'a7k2p', status: 'aktif', dibuatPada: '2026-09-27T01:00:00Z' },
  ];
  const siswa = NAMA.map((nama) => ({ id: idSiswa(nama), nama }));
  const hasil: Input['hasil'] = [];
  for (const { id, nama } of siswa) {
    const riwayat = SKOR_KHUSUS[nama] ?? (SISWA_BARU.includes(nama) ? SKOR_SISWA_BARU : SKOR_LAIN);
    [...riwayat, SKOR_RIW004.get(nama) ?? null].forEach((skor, i) => {
      if (skor !== null) hasil.push({ sesiId: sesi[i].id, siswaId: id, skor, kelompok: tentukanKelompok(skor, 5) });
    });
  }
  return { sesi, hasil, siswa };
}

const HASIL_AC_8_6 = {
  perluPendampingan: [
    {
      siswaId: idSiswa('Budi Santoso'),
      nama: 'Budi Santoso',
      alasan: [ALASAN_BELUM_PAHAM],
      saran: [SARAN_BELUM_PAHAM],
      trenSkor: [2, 1, 1],
    },
    {
      siswaId: idSiswa('Rizky Pratama'),
      nama: 'Rizky Pratama',
      alasan: [ALASAN_MENURUN],
      saran: [SARAN_MENURUN],
      trenSkor: [4, 3, 2],
    },
    {
      siswaId: idSiswa('Sari Wulandari'),
      nama: 'Sari Wulandari',
      alasan: [ALASAN_TIDAK_MENGERJAKAN],
      saran: [SARAN_TIDAK_MENGERJAKAN],
      trenSkor: [],
    },
  ],
  kemajuan: [{ siswaId: idSiswa('Dimas Saputra'), nama: 'Dimas Saputra', dari: 'belum', ke: 'setengah' }],
};

describe('teks alasan dan saran (PRD AC-8.3, AC-8.4)', () => {
  it('sama persis dengan PRD', () => {
    expect([ALASAN_BELUM_PAHAM, ALASAN_TIDAK_MENGERJAKAN, ALASAN_MENURUN]).toEqual([
      'Belum paham 3x berturut-turut',
      'Tidak mengerjakan 2 cek terakhir',
      'Skor menurun 3 kali berturut-turut',
    ]);
    expect([SARAN_BELUM_PAHAM, SARAN_TIDAK_MENGERJAKAN, SARAN_MENURUN]).toEqual([
      'Beri materi penguatan konsep dan dampingi langsung.',
      'Ajak bicara untuk mengetahui kendalanya.',
      'Periksa topik terakhir yang sulit baginya.',
    ]);
  });
});

describe('data demo PRD 8.2 dan 8.5', () => {
  it('40 siswa, 132 hasil (94 di RIW001–RIW003, 38 di RIW004)', () => {
    const { siswa, hasil } = dataPrd();
    expect(new Set(NAMA).size).toBe(40);
    expect(siswa).toHaveLength(40);
    expect(hasil).toHaveLength(132);
    expect(hasil.filter((h) => h.sesiId === 'riw004')).toHaveLength(38);
    // Setiap nama di tabel Sesi 4 ada di PRD 8.2, dan hanya Sari serta Dimas yang tidak menjawab.
    expect(NAMA.filter((nama) => !SKOR_RIW004.has(nama))).toEqual(['Dimas Saputra', 'Sari Wulandari']);
    expect([...SKOR_RIW004.keys()].every((nama) => NAMA.includes(nama))).toBe(true);
  });
});

describe('hitungPendampingan', () => {
  it('data PRD 8.5 → tepat sesuai AC-8.6 (Budi, Rizky, Sari; Dimas di kemajuan; tidak ada siswa lain)', () => {
    expect(hitungPendampingan(dataPrd())).toEqual(HASIL_AC_8_6);
  });

  it('sesi tanpa jawaban diabaikan', () => {
    const data = dataPrd();
    // Kuis yang dibuka lalu ditutup tanpa jawaban, setelah RIW004.
    data.sesi.push({ id: 'kosong-selesai', status: 'selesai', dibuatPada: '2026-09-26T03:00:00Z' });
    data.sesi.push({ id: 'kosong-lain', status: 'selesai', dibuatPada: '2026-09-26T04:00:00Z' });
    expect(hitungPendampingan(data)).toEqual(HASIL_AC_8_6);
  });

  it('urutan input sesi dan hasil tidak memengaruhi keluaran', () => {
    const data = dataPrd();
    data.sesi.reverse();
    data.hasil.reverse();
    expect(hitungPendampingan(data)).toEqual(HASIL_AC_8_6);
  });

  describe('sesi aktif yang sudah berisi jawaban (AC-8.2, jendela per siswa)', () => {
    function denganJawabanAktif(jawab: Record<string, number>): Input {
      const data = dataPrd();
      for (const [nama, skor] of Object.entries(jawab)) {
        data.hasil.push({ sesiId: 'a7k2p', siswaId: idSiswa(nama), skor, kelompok: tentukanKelompok(skor, 5) });
      }
      return data;
    }

    it('siswa yang belum menjawab sesi aktif tetap dinilai dari 3 sesi selesai terakhir', () => {
      const hasil = hitungPendampingan(denganJawabanAktif({ 'Andi Saputra': 5, 'Citra Lestari': 4 }));
      expect(hasil).toEqual(HASIL_AC_8_6);
    });

    it('siswa yang sudah menjawab ikut dinilai dengan sesi aktif', () => {
      // Budi: RIW003 (1), RIW004 (1), aktif (4) → tidak lagi 3x belum, tetapi naik dari belum ke setengah.
      const hasil = hitungPendampingan(denganJawabanAktif({ 'Budi Santoso': 4, 'Andi Saputra': 5 }));
      expect(hasil.perluPendampingan.map((s) => s.nama)).toEqual(['Rizky Pratama', 'Sari Wulandari']);
      expect(hasil.kemajuan).toEqual([
        { siswaId: idSiswa('Budi Santoso'), nama: 'Budi Santoso', dari: 'belum', ke: 'setengah' },
        { siswaId: idSiswa('Dimas Saputra'), nama: 'Dimas Saputra', dari: 'belum', ke: 'setengah' },
      ]);
    });

    it('skor sesi aktif bisa memicu penurunan', () => {
      // Andi: RIW003 (5), RIW004 (5), aktif (3) → tidak turun ketat; Rizky: RIW003 (3), RIW004 (2), aktif (1) → turun.
      const hasil = hitungPendampingan(denganJawabanAktif({ 'Andi Saputra': 3, 'Rizky Pratama': 1 }));
      const rizky = hasil.perluPendampingan.find((s) => s.nama === 'Rizky Pratama');
      expect(rizky?.trenSkor).toEqual([3, 2, 1]);
      expect(hasil.perluPendampingan.some((s) => s.nama === 'Andi Saputra')).toBe(false);
    });

    it('sesi aktif tidak dihitung sebagai "tidak mengerjakan"', () => {
      const data = denganJawabanAktif({ 'Andi Saputra': 5 });
      // Hanya satu sesi selesai → aturan "2 cek terakhir" belum bisa diterapkan pada siapa pun.
      data.sesi = data.sesi.filter((s) => s.id === 'riw004' || s.id === 'a7k2p');
      data.hasil = data.hasil.filter((h) => h.sesiId === 'riw004' || h.sesiId === 'a7k2p');
      const hasil = hitungPendampingan(data);
      expect(hasil.perluPendampingan.some((s) => s.alasan.includes(ALASAN_TIDAK_MENGERJAKAN))).toBe(false);
    });
  });

  it('siswa dengan lebih dari satu alasan: urut jumlah alasan terbanyak, saran mengikuti urutan alasan', () => {
    const sesi: Input['sesi'] = [
      { id: 's1', status: 'selesai', dibuatPada: '2026-09-01T00:00:00Z' },
      { id: 's2', status: 'selesai', dibuatPada: '2026-09-02T00:00:00Z' },
      { id: 's3', status: 'selesai', dibuatPada: '2026-09-03T00:00:00Z' },
    ];
    const siswa = [
      { id: 'a', nama: 'Ani' },
      { id: 'z', nama: 'Zaki' },
    ];
    const hasil: Input['hasil'] = [
      // Ani hanya 3x belum (skor tetap).
      { sesiId: 's1', siswaId: 'a', skor: 1, kelompok: 'belum' },
      { sesiId: 's2', siswaId: 'a', skor: 1, kelompok: 'belum' },
      { sesiId: 's3', siswaId: 'a', skor: 1, kelompok: 'belum' },
      // Zaki 3x belum sekaligus menurun.
      { sesiId: 's1', siswaId: 'z', skor: 2, kelompok: 'belum' },
      { sesiId: 's2', siswaId: 'z', skor: 1, kelompok: 'belum' },
      { sesiId: 's3', siswaId: 'z', skor: 0, kelompok: 'belum' },
    ];
    const { perluPendampingan } = hitungPendampingan({ sesi, hasil, siswa });
    expect(perluPendampingan.map((s) => s.nama)).toEqual(['Zaki', 'Ani']);
    expect(perluPendampingan[0].alasan).toEqual([ALASAN_BELUM_PAHAM, ALASAN_MENURUN]);
    expect(perluPendampingan[0].saran).toEqual([SARAN_BELUM_PAHAM, SARAN_MENURUN]);
  });

  it('kurang dari 3 sesi: aturan "3x" dan "menurun" belum berlaku', () => {
    const sesi: Input['sesi'] = [
      { id: 's1', status: 'selesai', dibuatPada: '2026-09-01T00:00:00Z' },
      { id: 's2', status: 'selesai', dibuatPada: '2026-09-02T00:00:00Z' },
    ];
    const hasil: Input['hasil'] = [
      { sesiId: 's1', siswaId: 'a', skor: 2, kelompok: 'belum' },
      { sesiId: 's2', siswaId: 'a', skor: 1, kelompok: 'belum' },
    ];
    expect(hitungPendampingan({ sesi, hasil, siswa: [{ id: 'a', nama: 'Ani' }] })).toEqual({
      perluPendampingan: [],
      kemajuan: [],
    });
  });

  it('siswa yang tidak mengerjakan satu dari dua cek terakhir tidak masuk daftar', () => {
    const data = dataPrd();
    data.hasil = data.hasil.filter((h) => !(h.siswaId === idSiswa('Andi Saputra') && h.sesiId === 'riw004'));
    expect(hitungPendampingan(data).perluPendampingan.some((s) => s.nama === 'Andi Saputra')).toBe(false);
  });

  it('tanpa sesi sama sekali → kedua daftar kosong', () => {
    expect(hitungPendampingan({ sesi: [], hasil: [], siswa: [{ id: 'a', nama: 'Ani' }] })).toEqual({
      perluPendampingan: [],
      kemajuan: [],
    });
  });
});

describe('trenMenurun', () => {
  it.each([
    [[5, 4, 3], true],
    [[1, 5, 4, 3], true],
    [[5, 4, 4], false],
    [[4, 3], false],
    [[3], false],
    [[], false],
    [[1, 2, 1], false],
  ])('%j → %s', (tren, harapan) => {
    expect(trenMenurun(tren)).toBe(harapan);
  });
});
