import { describe, expect, it } from 'vitest';
import materiCadangan from '@/data/materi-cadangan.json';
import { acakPilihanLatihan, lengkapiIsiMateri, periksaIsiMateri, skemaIsiMateri, type IsiMateri } from '@/lib/validasi-materi';

function isiValid(): IsiMateri {
  return {
    judul: 'Pecahan Senilai di Sekitar Kita',
    ringkasan:
      'Pecahan senilai adalah pecahan yang tulisannya berbeda tetapi nilainya sama. Misalnya 1/2 pizza sama banyaknya dengan 2/4 pizza. Kalikan atau bagi pembilang dan penyebut dengan bilangan yang sama.',
    naskah_audio:
      'Halo! Satu per dua pizza sama banyaknya dengan dua per empat pizza. Kalikan angka atas dan bawah dengan bilangan yang sama, ya.',
    ide_video: {
      judul: 'Pecahan Senilai dengan Pizza',
      deskripsi: 'Video pendek yang memotong pizza menjadi beberapa bagian sama besar.',
      kata_kunci_pencarian: 'pecahan senilai pizza',
    },
    slide_ppt: {
      judul: 'Pecahan Senilai dengan Pizza',
      slide: [
        { judul: 'Apa itu pecahan senilai?', poin: ['Tulisannya berbeda tetapi nilainya sama.', 'Contoh: 1/2 pizza sama dengan 2/4 pizza.'] },
        { judul: 'Cara mencarinya', poin: ['Kalikan pembilang dan penyebut dengan bilangan yang sama.', 'Atau bagi keduanya dengan bilangan yang sama.'] },
        { judul: 'Rangkuman', poin: ['Pecahan senilai punya nilai yang sama.', 'Coba cari tiga pecahan yang senilai dengan 1/3.'] },
      ],
    },
    latihan: [
      {
        soal: 'Pecahan manakah yang senilai dengan 1/2?',
        pilihan: ['2/3', '2/4', '1/3', '3/4'],
        kunci: 'B',
        pembahasan: '1/2 dikali 2/2 menjadi 2/4.',
      },
      {
        soal: 'Pecahan manakah yang senilai dengan 2/3?',
        pilihan: ['4/6', '3/4', '2/6', '4/5'],
        kunci: 'A',
        pembahasan: '2/3 dikali 2/2 menjadi 4/6.',
      },
      {
        soal: 'Pecahan manakah yang senilai dengan 6/8?',
        pilihan: ['2/4', '5/7', '3/4', '1/8'],
        kunci: 'C',
        pembahasan: '6/8 dibagi 2/2 menjadi 3/4.',
      },
    ],
  };
}

describe('skemaIsiMateri', () => {
  it('menerima isi yang valid', () => {
    expect(skemaIsiMateri.safeParse(isiValid()).success).toBe(true);
  });

  it('menolak ringkasan yang terlalu pendek', () => {
    expect(skemaIsiMateri.safeParse({ ...isiValid(), ringkasan: 'Terlalu pendek.' }).success).toBe(false);
  });

  it('menolak latihan yang tidak berisi tepat 3 soal', () => {
    const isi = isiValid();
    expect(skemaIsiMateri.safeParse({ ...isi, latihan: isi.latihan.slice(0, 2) }).success).toBe(false);
  });

  it('menolak kunci di luar A–D', () => {
    const isi = isiValid();
    isi.latihan[0] = { ...isi.latihan[0], kunci: 'E' as 'A' };
    expect(skemaIsiMateri.safeParse(isi).success).toBe(false);
  });
});

describe('periksaIsiMateri', () => {
  it('menerima isi valid dan mengembalikan isi', () => {
    const hasil = periksaIsiMateri(isiValid());
    expect(hasil).toEqual({ ok: true, isi: isiValid() });
  });

  it('menolak data yang bukan objek dengan alasan', () => {
    const hasil = periksaIsiMateri('bukan objek');
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.alasan.length).toBeGreaterThan(0);
  });

  it('menolak isi dengan properti yang kurang', () => {
    const tanpaAudio: Partial<IsiMateri> = isiValid();
    delete tanpaAudio.naskah_audio;
    const hasil = periksaIsiMateri(tanpaAudio);
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.alasan).toMatch(/naskah_audio/);
  });

  it('menolak pilihan latihan yang kembar', () => {
    const isi = isiValid();
    isi.latihan[1] = { ...isi.latihan[1], pilihan: ['4/6', '3/4', '4/6', '4/5'] };
    const hasil = periksaIsiMateri(isi);
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.alasan).toMatch(/soal latihan 2/i);
  });

  it('menganggap pilihan kembar walau beda spasi atau huruf besar', () => {
    const isi = isiValid();
    isi.latihan[0] = { ...isi.latihan[0], pilihan: ['2/3', '2/4', ' 2/3 ', '3/4'] };
    expect(periksaIsiMateri(isi).ok).toBe(false);
  });

  describe('menolak frasa label kelompok (PRD D-2)', () => {
    it.each([
      ['belum paham', (isi: IsiMateri) => ({ ...isi, judul: 'Materi untuk yang belum paham' })],
      ['Setengah Paham', (isi: IsiMateri) => ({ ...isi, ringkasan: `${isi.ringkasan} Cocok untuk Setengah Paham.` })],
      ['SUDAH PAHAM', (isi: IsiMateri) => ({ ...isi, naskah_audio: `${isi.naskah_audio} Kamu SUDAH PAHAM.` })],
      ['kelompok', (isi: IsiMateri) => ({ ...isi, slide_ppt: { ...isi.slide_ppt, judul: 'Belajar bersama kelompok belajarmu' } })],
      ['Kelompok', (isi: IsiMateri) => ({ ...isi, slide_ppt: { ...isi.slide_ppt, slide: [{ judul: 'Kelompok pecahan', poin: isi.slide_ppt.slide[0].poin }, ...isi.slide_ppt.slide.slice(1)] } })],
      [
        'belum  paham (spasi ganda) di pembahasan',
        (isi: IsiMateri) => ({
          ...isi,
          latihan: [{ ...isi.latihan[0], pembahasan: 'Kalau belum  paham, ulangi langkahnya.' }, isi.latihan[1], isi.latihan[2]],
        }),
      ],
      [
        'kelompok di pilihan',
        (isi: IsiMateri) => ({
          ...isi,
          latihan: [isi.latihan[0], { ...isi.latihan[1], pilihan: ['4/6', '3/4', 'kelompok', '4/5'] }, isi.latihan[2]],
        }),
      ],
    ] as const)('%s', (_, ubah) => {
      const hasil = periksaIsiMateri(ubah(isiValid()));
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) expect(hasil.alasan).toMatch(/label kelompok|kata "kelompok"/);
    });

    it('tidak menolak kata "paham" yang berdiri sendiri', () => {
      const isi = { ...isiValid(), judul: 'Ayo paham pecahan senilai' };
      expect(periksaIsiMateri(isi).ok).toBe(true);
    });
  });

  it.each([
    ['\\frac', (isi: IsiMateri) => ({ ...isi, ringkasan: `${isi.ringkasan} Contoh: \\frac{1}{2}.` })],
    ['$', (isi: IsiMateri) => ({ ...isi, latihan: [{ ...isi.latihan[0], soal: 'Berapa nilai $1/2$ jika dikali 2/2?' }, isi.latihan[1], isi.latihan[2]] })],
  ] as const)('menolak notasi LaTeX %s', (_, ubah) => {
    const hasil = periksaIsiMateri(ubah(isiValid()));
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.alasan).toMatch(/LaTeX/);
  });
});

describe('periksaIsiMateri: pembahasan tanpa huruf pilihan', () => {
  const denganPembahasan = (pembahasan: string): IsiMateri => {
    const isi = isiValid();
    return { ...isi, latihan: [isi.latihan[0], { ...isi.latihan[1], pembahasan }, isi.latihan[2]] };
  };

  it.each([
    'Jadi jawabannya adalah pilihan B, yaitu 4/6.',
    'Jawaban C benar karena 2/3 dikali 2/2 menjadi 4/6.',
    'Jawaban yang benar adalah D karena dikali 2.',
    'Jawaban yang tepat ialah A, sebab 2/3 = 4/6.',
    'Pilih opsi (A) karena 2/3 dikali 2/2 menjadi 4/6.',
    'Pilihan A: 4/6, karena pembilang dan penyebut dikali 2.',
  ])('menolak "%s"', (pembahasan) => {
    const hasil = periksaIsiMateri(denganPembahasan(pembahasan));
    expect(hasil).toEqual({
      ok: false,
      alasan: 'Pembahasan soal latihan 2 tidak boleh menyebut huruf pilihan (A, B, C, D); sebut nilai jawabannya.',
    });
  });

  it.each([
    'Pilihan 2/3 salah karena diperoleh dengan menambah 1, bukan mengalikan.',
    'Jawaban 4/6 benar karena 2/3 dikali 2/2.',
    'Jawaban akhirnya adalah 4/6 karena dikali 2.',
    'Bayangkan pizza A dibagi dua sama besar, jadi 2/3 = 4/6.',
  ])('tetap menerima "%s"', (pembahasan) => {
    expect(periksaIsiMateri(denganPembahasan(pembahasan)).ok).toBe(true);
  });
});

/** Generator acak sederhana yang bisa diulang (untuk tes sebaran). */
function acakBerbenih(benih: number): () => number {
  let x = benih;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

describe('acakPilihanLatihan', () => {
  it('deterministik untuk fungsi acak yang sama', () => {
    // acak() = 0 → Fisher–Yates menghasilkan urutan [1, 2, 3, 0].
    const hasil = acakPilihanLatihan(isiValid(), () => 0);
    expect(hasil.latihan[0].pilihan).toEqual(['2/4', '1/3', '3/4', '2/3']);
    expect(hasil.latihan[0].kunci).toBe('A');
    expect(hasil.latihan[2].pilihan).toEqual(['5/7', '3/4', '1/8', '2/4']);
    expect(hasil.latihan[2].kunci).toBe('B');
  });

  it('acak() mendekati 1 tidak mengubah urutan', () => {
    expect(acakPilihanLatihan(isiValid(), () => 0.999999)).toEqual(isiValid());
  });

  it('kunci tetap menunjuk teks jawaban yang sama dan pilihan tetap empat yang sama', () => {
    const asal = isiValid();
    const acak = acakBerbenih(42);
    for (let n = 0; n < 50; n++) {
      const hasil = acakPilihanLatihan(asal, acak);
      hasil.latihan.forEach((l, i) => {
        const a = asal.latihan[i];
        expect([...l.pilihan].sort()).toEqual([...a.pilihan].sort());
        expect(l.pilihan['ABCD'.indexOf(l.kunci)]).toBe(a.pilihan['ABCD'.indexOf(a.kunci)]);
        expect({ soal: l.soal, pembahasan: l.pembahasan }).toEqual({ soal: a.soal, pembahasan: a.pembahasan });
      });
    }
  });

  it('posisi kunci tersebar ke A, B, C, dan D', () => {
    const semuaB = isiValid();
    semuaB.latihan = semuaB.latihan.map((l) => ({ ...l, pilihan: [l.pilihan[1], l.pilihan[0], l.pilihan[2], l.pilihan[3]], kunci: 'B' }));
    const acak = acakBerbenih(7);
    const posisi = new Set<string>();
    for (let n = 0; n < 100; n++) acakPilihanLatihan(semuaB, acak).latihan.forEach((l) => posisi.add(l.kunci));
    expect([...posisi].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('tidak mengubah objek asal dan hasilnya tetap lolos periksaIsiMateri', () => {
    const asal = isiValid();
    const hasil = acakPilihanLatihan(asal, acakBerbenih(3));
    expect(asal).toEqual(isiValid());
    expect(periksaIsiMateri(hasil).ok).toBe(true);
  });
});

describe('data/materi-cadangan.json (architecture.md 9.5)', () => {
  it('berisi tepat tiga kelompok', () => {
    expect(Object.keys(materiCadangan).sort()).toEqual(['belum', 'setengah', 'sudah']);
  });

  it.each(['belum', 'setengah', 'sudah'] as const)('materi %s lolos periksaIsiMateri', (kelompok) => {
    const hasil = periksaIsiMateri(materiCadangan[kelompok]);
    expect(hasil.ok ? 'lolos' : hasil.alasan).toBe('lolos');
  });
});

describe('lengkapiIsiMateri', () => {
  const tanpa = (kunci: 'slide_ppt' | 'ide_video') => {
    const { [kunci]: _dibuang, ...sisa } = isiValid();
    void _dibuang;
    return sisa;
  };

  it('materi yang sudah lengkap dikembalikan apa adanya', () => {
    const isi = isiValid();
    expect(lengkapiIsiMateri(isi)).toBe(isi);
  });

  it('materi lama tanpa slide_ppt mendapat slide yang valid dan ide_video tetap', () => {
    const hasil = lengkapiIsiMateri(tanpa('slide_ppt'));
    expect(hasil.ide_video).toEqual(isiValid().ide_video);
    expect(periksaIsiMateri(hasil).ok).toBe(true);
    expect(hasil.slide_ppt.slide.length).toBeGreaterThanOrEqual(3);
  });

  it('materi tanpa ide_video mendapat ide video dari judul dan ringkasan', () => {
    const hasil = lengkapiIsiMateri(tanpa('ide_video'));
    expect(hasil.slide_ppt).toEqual(isiValid().slide_ppt);
    expect(hasil.ide_video.kata_kunci_pencarian).toBe(isiValid().judul);
    expect(periksaIsiMateri(hasil).ok).toBe(true);
  });

  it('data yang bukan objek dikembalikan tanpa error', () => {
    expect(lengkapiIsiMateri(null)).toBeNull();
    expect(lengkapiIsiMateri('teks')).toBe('teks');
  });
});
