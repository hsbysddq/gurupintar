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

const soal = (ubah: Partial<SoalBaru> = {}): SoalBaru => ({
  teks: 'Pecahan yang senilai dengan 1/3 adalah …',
  pilihan: ['2/6', '1/6', '3/6', '2/3'],
  kunci: 'A',
  miskonsepsi: ['', 'Hanya mengalikan penyebut.', 'Menambah 2 pada pembilang.', ''],
  ...ubah,
});

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
      teks: 'Soal nomor 1',
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

  it('membuang spasi di awal dan akhir teks soal, pilihan, dan miskonsepsi', () => {
    const [baris] = keBarisSoal(TOPIK_ID, [
      soal({ teks: '  Soal  ', pilihan: [' 2/6 ', '1/6', '3/6', '2/3'], miskonsepsi: ['', '  Alasan B  ', '', ''] }),
    ]);
    expect(baris.teks).toBe('Soal');
    expect(baris.pilihan[0]).toEqual({ kode: 'A', teks: '2/6' });
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
  it('hanya topik dengan tepat 5 soal; topik demo di atas, lalu urut nama', () => {
    const daftar = susunDaftarTopik([
      { id: 'z', nama: 'Zat dan Pecahan', jumlahSoal: 5 },
      { id: 'yatim', nama: 'Aljabar', jumlahSoal: 0 },
      { id: TOPIK_DEMO_ID, nama: 'Pecahan Senilai', jumlahSoal: 5 },
      { id: 'b', nama: 'bangun datar', jumlahSoal: 5 },
      { id: 'kurang', nama: 'Bilangan Bulat', jumlahSoal: 4 },
    ]);
    expect(daftar).toEqual([
      { id: TOPIK_DEMO_ID, nama: 'Pecahan Senilai' },
      { id: 'b', nama: 'bangun datar' },
      { id: 'z', nama: 'Zat dan Pecahan' },
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

  it('memetakan setiap kolom yang salah ke pesan bahasa Indonesia, satu pesan per kolom', () => {
    const b = isian();
    b.nama = 'ab';
    b.capaianPembelajaran = 'pendek';
    b.soal[0].teks = 'abc';
    b.soal[1].pilihan[2] = '';
    b.soal[2].pilihan[3] = '2/6';
    b.soal[3].kunci = '';
    b.soal[4].miskonsepsi[1] = 'a'.repeat(201);

    expect(pesanGalatTopik(skemaBodyTopikBaru.safeParse(b))).toEqual({
      nama: 'Nama topik harus 3–80 karakter.',
      capaianPembelajaran: 'Capaian pembelajaran harus 10–300 karakter.',
      'soal.0.teks': 'Teks soal harus 5–300 karakter.',
      'soal.1.pilihan.2': 'Pilihan harus diisi, maksimal 100 karakter.',
      'soal.2.pilihan.3': 'Pilihan tidak boleh sama dengan pilihan lain.',
      'soal.3.kunci': 'Pilih kunci jawaban.',
      'soal.4.miskonsepsi.1': 'Miskonsepsi maksimal 200 karakter.',
    });
  });
});

describe('cadanganTersedia', () => {
  it('hanya untuk topik demo Pecahan Senilai', () => {
    expect(cadanganTersedia(TOPIK_DEMO_ID)).toBe(true);
    expect(cadanganTersedia(TOPIK_ID)).toBe(false);
  });
});
