import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import materiCadangan from '@/data/materi-cadangan.json';
import { buatPdfBacaan } from '@/lib/unduh-bacaan';
import type { IsiMateri } from '@/lib/validasi-materi';

const BAB = {
  judul: 'Mengapa pecahan senilai penting?',
  paragraf: [
    'Bayangkan dua kue yang ukurannya sama. Kue pertama dipotong menjadi dua bagian, sedangkan kue kedua dipotong menjadi empat bagian.',
    'Pecahan senilai adalah pecahan yang tulisannya berbeda tetapi nilainya sama. Kita bisa mengalikannya dengan bilangan yang sama.',
  ],
  poin: ['Nilai pecahan tidak berubah.', 'Bentuk tulisan boleh berbeda.'],
  contoh: '1/2 = 2/4 = 4/8.',
};

const ISI: IsiMateri = {
  ...(materiCadangan.belum as IsiMateri),
  format_utama: 'bacaan',
  gaya_bacaan: 'santai',
  bacaan: {
    judul: 'Buku Kecil Pecahan Senilai',
    subjudul: 'Belajar pecahan lewat kue dan cerita sehari-hari.',
    bab: [BAB, { ...BAB, judul: 'Mencari pecahan senilai' }, { ...BAB, judul: 'Menyederhanakan pecahan' }],
  },
};

describe('buatPdfBacaan', () => {
  it('menghasilkan PDF valid dengan sampul, daftar isi, dan bab', async () => {
    const bytes = await buatPdfBacaan(ISI);

    expect(bytes.length).toBeGreaterThan(1000);
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe('%PDF-');

    const dokumen = await PDFDocument.load(bytes);
    expect(dokumen.getPageCount()).toBeGreaterThanOrEqual(3);
    expect(dokumen.getTitle()).toBe('Buku Kecil Pecahan Senilai');
  });
});
