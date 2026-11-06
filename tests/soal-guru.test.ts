import { describe, expect, it } from 'vitest';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';
import { skemaBodyTopikBaru } from '@/lib/skema-api';
import {
  cadanganTersedia,
  keBarisSoal,
  pesanGalatTopik,
  samakanTeksPilihan,
  susunDaftarTopik,
  type SoalBaru,
} from '@/lib/soal-guru';

const TOPIK_ID = '00000000-0000-4000-8000-000000000999';

import type { SoalPilganBaru } from '@/lib/soal-guru';
const soal = (ubah: Partial<SoalPilganBaru> = {}): SoalPilganBaru => ({
  teks: 'Pecahan yang senilai dengan 1/3 adalah …',
  pilihan: ['2/6', '1/6', '3/6', '2/3'],
  kunci: 'A',
  miskonsepsi: ['', 'Hanya mengalikan penyebut.', 'Menambah 2 pada pembilang.', ''],
  ...ubah,
});

function gambarPilihan(baris: ReturnType<typeof keBarisSoal>[number], indeks: number) {
  return Array.isArray(baris.pilihan) ? baris.pilihan[indeks] : undefined;
}

describe('keBarisSoal (PRD F-10)', () => {
  it('menyusun baris tabel soal: nomor 1–5 sesuai urutan, pilihan berkode A–D', () => {
    const daftar = [1, 2, 3, 4, 5].map((n) => soal({ teks: `Soal nomor ${n}` }));
    const baris = keBarisSoal(TOPIK_ID, daftar);

    expect(baris).toHaveLength(5);
    expect(baris.map((b) => b.nomor)).toEqual([1, 2, 3, 4, 5]);
    expect(baris.map((b) => b.teks)).toEqual(['Soal nomor 1', 'Soal nomor 2', 'Soal nomor 3', 'Soal nomor 4', 'Soal nomor 5']);
    expect(baris[0]).toEqual({
      topik_id: TOPIK_ID,
      nomor: 1,
      tipe: 'pilgan',
      teks: 'Soal nomor 1',
      gambar: null,
      pilihan: [
        { kode: 'A', teks: '2/6' },
        { kode: 'B', teks: '1/6' },
        { kode: 'C', teks: '3/6' },
        { kode: 'D', teks: '2/3' },
      ],
      kunci: 'A',
      miskonsepsi: { B: 'Hanya mengalikan penyebut.', C: 'Menambah 2 pada pembilang.' },
    });
  });

  it('menyimpan gambar per pilihan A–D tanpa mengubah pilihan lain', () => {
    const [baris] = keBarisSoal(TOPIK_ID, [
      soal({
        pilihan_gambar: ['data:image/png;base64,AAA=', '', 'data:image/webp;base64,BBB=', ''],
      }),
    ]);

    expect(gambarPilihan(baris, 0)).toEqual({
      kode: 'A',
      teks: '2/6',
      gambar: 'data:image/png;base64,AAA=',
    });
    expect(gambarPilihan(baris, 1)).toEqual({ kode: 'B', teks: '1/6' });
    expect(gambarPilihan(baris, 2)).toEqual({
      kode: 'C',
      teks: '3/6',
      gambar: 'data:image/webp;base64,BBB=',
    });
    expect(gambarPilihan(baris, 3)).toEqual({ kode: 'D', teks: '2/3' });
  });

  it('membuang spasi di awal dan akhir teks soal, pilihan, dan miskonsepsi', () => {
    const [baris] = keBarisSoal(TOPIK_ID, [
      soal({ teks: '  Soal  ', pilihan: [' 2/6 ', '1/6', '3/6', '2/3'], miskonsepsi: ['', '  Alasan B  ', '', ''] }),
    ]);
    expect(baris.teks).toBe('Soal');
    expect(Array.isArray(baris.pilihan) && baris.pilihan[0]).toEqual({ kode: 'A', teks: '2/6' });
    expect(baris.miskonsepsi).toEqual({ B: 'Alasan B' });
  });

  it('miskonsepsi tidak pernah memuat kunci, termasuk jika kunci diganti setelah miskonsepsi ditulis', () => {
    const [baris] = keBarisSoal(TOPIK_ID, [
      soal({ kunci: 'B', miskonsepsi: ['Alasan A', 'Alasan B (kini kunci)', 'Alasan C', 'Alasan D'] }),
    ]);
    expect(baris.kunci).toBe('B');
    expect(baris.miskonsepsi).toEqual({ A: 'Alasan A', C: 'Alasan C', D: 'Alasan D' });
  });

  it('miskonsepsi kosong atau hanya spasi tidak disimpan', () => {
    const [baris] = keBarisSoal(TOPIK_ID, [soal({ miskonsepsi: ['', '   ', '', '\n'] })]);
    expect(baris.miskonsepsi).toEqual({});
  });

  it('mengubah tipe TKA & esai beserta gambar menjadi baris tabel soal dengan benar', () => {
    const daftar: SoalBaru[] = [
      {
        tipe: 'pilgan_kompleks',
        teks: 'Pilih pecahan senilai 1/2',
        gambar: 'data:image/png;base64,AAA=',
        pilihan: ['2/4', '3/6', '1/3', '2/5'],
        kunciKompleks: ['B', 'A'],
        miskonsepsi: ['Tidak dipakai karena kunci', '', 'Salah konsep', ''],
      },
      {
        tipe: 'esai',
        teks: 'Hitung luas segitiga!',
        pedomanJawaban: ' 24 cm² ',
        catatanMiskonsepsi: ' Lupa dikali 1/2 ',
      },
    ];
    const baris = keBarisSoal(TOPIK_ID, daftar);
    expect(baris[0]).toMatchObject({
      nomor: 1,
      tipe: 'pilgan_kompleks',
      gambar: 'data:image/png;base64,AAA=',
      kunci: 'A,B',
      miskonsepsi: { C: 'Salah konsep' },
    });
    expect(baris[1]).toEqual({
      topik_id: TOPIK_ID,
      nomor: 2,
      tipe: 'esai',
      teks: 'Hitung luas segitiga!',
      gambar: null,
      pilihan: [],
      kunci: '24 cm²',
      miskonsepsi: { umum: 'Lupa dikali 1/2' },
    });
  });
});

describe('samakanTeksPilihan', () => {
  it.each([
    [' 2/3 ', '2/3'],
    ['Tidak  bisa   dibandingkan', 'tidak bisa dibandingkan'],
    ['SAMA BANYAK', 'sama banyak'],
  ])('"%s" → "%s"', (masuk, keluar) => {
    expect(samakanTeksPilihan(masuk)).toBe(keluar);
  });
});

describe('susunDaftarTopik', () => {
  it('hanya topik dengan minimal satu soal; topik demo di atas, lalu urut nama', () => {
    const daftar = susunDaftarTopik([
      { id: 'z', nama: 'Zat dan Pecahan', jumlahSoal: 5 },
      { id: 'yatim', nama: 'Aljabar', jumlahSoal: 0 },
      { id: TOPIK_DEMO_ID, nama: 'Pecahan Senilai', jumlahSoal: 5 },
      { id: 'b', nama: 'bangun datar', jumlahSoal: 5 },
      { id: 'kurang', nama: 'Bilangan Bulat', jumlahSoal: 4 },
    ]);
    expect(daftar).toEqual([
      { id: TOPIK_DEMO_ID, nama: 'Pecahan Senilai', jumlahSoal: 5 },
      { id: 'b', nama: 'bangun datar', jumlahSoal: 5 },
      { id: 'kurang', nama: 'Bilangan Bulat', jumlahSoal: 4 },
      { id: 'z', nama: 'Zat dan Pecahan', jumlahSoal: 5 },
    ]);
  });
});

describe('pesanGalatTopik', () => {
  const isian = () => ({
    nama: 'Pecahan Biasa',
    capaianPembelajaran: 'Peserta didik dapat membandingkan pecahan.',
    soal: [1, 2, 3, 4, 5].map(() => ({
      teks: 'Pecahan yang senilai dengan 1/3 adalah …',
      pilihan: ['2/6', '1/6', '3/6', '2/3'],
      kunci: 'A',
      miskonsepsi: ['', '', '', ''],
    })),
  });

  it('isian valid → tidak ada pesan', () => {
    expect(pesanGalatTopik(skemaBodyTopikBaru.safeParse(isian()))).toEqual({});
  });

  it('menerima gambar per pilihan A–D', () => {
    const dasar = isian();
    const b = {
      ...dasar,
      soal: dasar.soal.map((soal, i) =>
        i === 0
          ? { ...soal, pilihan_gambar: ['data:image/png;base64,AAA=', undefined, undefined, undefined] }
          : soal,
      ),
    };
    expect(skemaBodyTopikBaru.safeParse(b).success).toBe(true);
  });

  it('memetakan setiap kolom yang salah ke pesan bahasa Indonesia, satu pesan per kolom', () => {
    const b = isian();
    b.nama = 'ab';
    b.capaianPembelajaran = 'pendek';
    b.soal[0].teks = 'abc';
    b.soal[1].pilihan[2] = '';
    b.soal[2].pilihan[3] = '2/6';
    b.soal[3].kunci = '';
    b.soal[4].miskonsepsi[1] = 'a'.repeat(501);

    expect(pesanGalatTopik(skemaBodyTopikBaru.safeParse(b))).toEqual({
      nama: 'Nama topik harus 3–80 karakter.',
      capaianPembelajaran: 'Capaian pembelajaran harus 10–300 karakter.',
      'soal.0.teks': 'Teks soal harus 5–300 karakter.',
      'soal.1.pilihan.2': 'Pilihan harus diisi, maksimal 100 karakter.',
      'soal.2.pilihan.3': 'Pilihan tidak boleh sama dengan pilihan lain.',
      'soal.3.kunci': 'Pilih kunci jawaban.',
      'soal.4.miskonsepsi.1': 'Miskonsepsi maksimal 500 karakter.',
    });
  });
});

describe('cadanganTersedia', () => {
  it('hanya untuk topik demo Pecahan Senilai', () => {
    expect(cadanganTersedia(TOPIK_DEMO_ID)).toBe(true);
    expect(cadanganTersedia(TOPIK_ID)).toBe(false);
  });
});
