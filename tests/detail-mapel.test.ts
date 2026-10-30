import { describe, expect, it } from 'vitest';
import {
  formatTanggalKartu,
  pilihTab,
  susunDetailMapel,
  type DataDetailMapel,
  type SesiDetail,
} from '@/lib/detail-mapel';

const KELAS = { id: 'k1', nama: 'Kelas 7A', mapel: 'Matematika', namaGuru: 'Bu Rina' };

function sesi(id: string, tanggal: string, patch: Partial<SesiDetail> = {}): SesiDetail {
  return {
    id,
    kodeKelas: `KODE${id}`,
    status: 'selesai',
    dibuatPada: tanggal,
    namaTopik: `Topik ${id}`,
    statusMateri: 'belum-mengerjakan',
    ...patch,
  };
}

const DATA: DataDetailMapel = {
  kelas: KELAS,
  sesi: [
    sesi('s1', '2026-10-01T03:00:00Z', { statusMateri: 'tersedia' }),
    sesi('s2', '2026-10-08T03:00:00Z', { statusMateri: 'disiapkan' }),
    sesi('s3', '2026-10-15T03:00:00Z'),
    sesi('s4', '2026-10-22T03:00:00Z', { status: 'aktif' }),
  ],
  hasil: [
    { sesiId: 's1', skor: 5, total: 5, dikirimPada: '2026-10-01T04:00:00Z' },
    { sesiId: 's2', skor: 3, total: 5, dikirimPada: '2026-10-08T04:00:00Z' },
  ],
};

describe('susunDetailMapel: materi kelas', () => {
  it('hanya memuat materi yang tersedia atau sedang disiapkan, terbaru dahulu', () => {
    const { materi } = susunDetailMapel(DATA);
    expect(materi.map((m) => m.sesiId)).toEqual(['s2', 's1']);
  });

  it('tautan hanya ada untuk materi yang sudah dibagikan', () => {
    const { materi } = susunDetailMapel(DATA);
    expect(materi.find((m) => m.sesiId === 's1')).toMatchObject({ status: 'tersedia', href: '/siswa/materi?sesi=s1' });
    expect(materi.find((m) => m.sesiId === 's2')).toMatchObject({ status: 'disiapkan', href: null });
  });

  it('kosong bila belum ada kuis yang dikerjakan', () => {
    const r = susunDetailMapel({ kelas: KELAS, sesi: [sesi('s1', '2026-10-01T03:00:00Z')], hasil: [] });
    expect(r.materi).toEqual([]);
  });
});

describe('susunDetailMapel: kuis', () => {
  it('menentukan status tiap kuis dari status sesi dan ada tidaknya hasil', () => {
    const { kuis } = susunDetailMapel({
      ...DATA,
      sesi: [...DATA.sesi, sesi('s5', '2026-10-23T03:00:00Z', { status: 'aktif' })],
      hasil: [...DATA.hasil, { sesiId: 's5', skor: 4, total: 5, dikirimPada: '2026-10-23T04:00:00Z' }],
    });
    const peta = new Map(kuis.map((k) => [k.sesiId, k.status]));
    expect(peta.get('s1')).toBe('selesai-dikerjakan');
    expect(peta.get('s2')).toBe('selesai-dikerjakan');
    expect(peta.get('s3')).toBe('selesai-tidak');
    expect(peta.get('s4')).toBe('aktif-belum');
    expect(peta.get('s5')).toBe('aktif-selesai');
  });

  it('terbaru dahulu, dengan skor hanya untuk kuis yang dikerjakan', () => {
    const { kuis } = susunDetailMapel(DATA);
    expect(kuis.map((k) => k.sesiId)).toEqual(['s4', 's3', 's2', 's1']);
    expect(kuis.find((k) => k.sesiId === 's1')).toMatchObject({ skor: 5, total: 5 });
    expect(kuis.find((k) => k.sesiId === 's3')).toMatchObject({ skor: null, total: null });
  });

  it('tautan mengerjakan hanya untuk kuis aktif dan memakai kode kuis', () => {
    const { kuis } = susunDetailMapel(DATA);
    expect(kuis.find((k) => k.sesiId === 's4')?.hrefKerjakan).toBe('/siswa/gabung?kode=KODEs4');
    expect(kuis.find((k) => k.sesiId === 's3')?.hrefKerjakan).toBeNull();
  });

  it('kuisAktif berisi kuis aktif yang belum dikerjakan, null bila sudah atau tidak ada', () => {
    expect(susunDetailMapel(DATA).kuisAktif).toEqual({
      sesiId: 's4',
      judul: 'Topik s4',
      href: '/siswa/gabung?kode=KODEs4',
    });
    const sudah = susunDetailMapel({
      ...DATA,
      hasil: [...DATA.hasil, { sesiId: 's4', skor: 2, total: 5, dikirimPada: '2026-10-22T04:00:00Z' }],
    });
    expect(sudah.kuisAktif).toBeNull();
    expect(susunDetailMapel({ kelas: KELAS, sesi: [], hasil: [] }).kuisAktif).toBeNull();
  });
});

describe('susunDetailMapel: histori hasil kuis', () => {
  it('terbaru dahulu dengan persentase dibulatkan', () => {
    const { histori } = susunDetailMapel({
      ...DATA,
      hasil: [
        { sesiId: 's1', skor: 1, total: 3, dikirimPada: '2026-10-01T04:00:00Z' },
        { sesiId: 's2', skor: 3, total: 5, dikirimPada: '2026-10-08T04:00:00Z' },
      ],
    });
    expect(histori.map((h) => h.sesiId)).toEqual(['s2', 's1']);
    expect(histori.map((h) => h.persen)).toEqual([60, 33]);
    expect(histori[0]).toMatchObject({ judul: 'Topik s2', skor: 3, total: 5 });
  });

  it('meringkas jumlah, rata-rata, terbaik, dan tren', () => {
    const r = susunDetailMapel(DATA);
    // 100% lalu 60%: rata-rata 80, terbaik 100, turun 40 poin dari kuis sebelumnya.
    expect(r.ringkasan).toEqual({ jumlahKuis: 2, rataRata: 80, terbaik: 100, perubahan: -40 });
    expect(r.tren).toContain('Turun 40 poin');
  });

  it('kosong dan tanpa rata-rata bila belum ada hasil', () => {
    const r = susunDetailMapel({ kelas: KELAS, sesi: DATA.sesi, hasil: [] });
    expect(r.histori).toEqual([]);
    expect(r.ringkasan).toEqual({ jumlahKuis: 0, rataRata: null, terbaik: null, perubahan: null });
  });

  it('mengabaikan hasil dari sesi yang tidak ada di kelas ini', () => {
    const r = susunDetailMapel({
      ...DATA,
      hasil: [...DATA.hasil, { sesiId: 'asing', skor: 5, total: 5, dikirimPada: '2026-10-25T04:00:00Z' }],
    });
    expect(r.histori.map((h) => h.sesiId)).toEqual(['s2', 's1']);
    expect(r.ringkasan.jumlahKuis).toBe(2);
  });
});

describe('pilihTab', () => {
  it('mengenali tab yang valid dan jatuh ke materi untuk selain itu', () => {
    expect(pilihTab('kuis')).toBe('kuis');
    expect(pilihTab('histori')).toBe('histori');
    expect(pilihTab('materi')).toBe('materi');
    expect(pilihTab('ngawur')).toBe('materi');
    expect(pilihTab(undefined)).toBe('materi');
  });
});

describe('susunDetailMapel: kerjakan ulang', () => {
  const ULANG: DataDetailMapel = {
    kelas: KELAS,
    sesi: [sesi('s4', '2026-10-22T03:00:00Z', { status: 'aktif', statusMateri: 'tersedia' })],
    hasil: [
      { sesiId: 's4', skor: 5, total: 5, dikirimPada: '2026-10-22T06:00:00Z' },
      { sesiId: 's4', skor: 2, total: 5, dikirimPada: '2026-10-22T04:00:00Z' },
    ],
  };

  it('kartu kuis memakai pengerjaan terakhir dan mencatat jumlah pengerjaan', () => {
    const { kuis } = susunDetailMapel(ULANG);
    expect(kuis[0]).toMatchObject({ status: 'aktif-selesai', skor: 5, total: 5, jumlahPengerjaan: 2 });
    expect(kuis[0].hrefKerjakan).toBe('/siswa/gabung?kode=KODEs4');
  });

  it('histori memuat semua pengerjaan, terbaru dahulu, dengan nomor pengerjaan', () => {
    const { histori } = susunDetailMapel(ULANG);
    expect(histori.map((h) => [h.pengerjaanKe, h.skor])).toEqual([
      [2, 5],
      [1, 2],
    ]);
  });

  it('ringkasan menghitung semua pengerjaan dan tren membandingkan dua pengerjaan terakhir', () => {
    const { ringkasan } = susunDetailMapel(ULANG);
    expect(ringkasan.jumlahKuis).toBe(2);
    expect(ringkasan.rataRata).toBe(70);
    expect(ringkasan.terbaik).toBe(100);
    expect(ringkasan.perubahan).toBe(60);
  });

  it('kuis yang belum dikerjakan punya 0 pengerjaan', () => {
    const { kuis } = susunDetailMapel(DATA);
    expect(kuis.find((k) => k.sesiId === 's3')?.jumlahPengerjaan).toBe(0);
    expect(kuis.find((k) => k.sesiId === 's1')?.jumlahPengerjaan).toBe(1);
  });
});

describe('formatTanggalKartu', () => {
  it('memakai tanggal menurut WIB', () => {
    // 18:00 UTC tanggal 5 sudah 01:00 WIB tanggal 6.
    const hasil = formatTanggalKartu('2024-01-05T18:00:00Z');
    expect(hasil).toMatch(/^6 Jan/);
    expect(hasil).toMatch(/2024$/);
  });
});

describe('susunDetailMapel: grafik dan status per mapel', () => {
  const tiga = [sesi('s1', '2026-10-01T03:00:00Z'), sesi('s2', '2026-10-02T03:00:00Z'), sesi('s3', '2026-10-03T03:00:00Z')];
  const hasil = (sesiId: string, skor: number) => ({ sesiId, skor, total: 5, dikirimPada: `2026-10-0${sesiId.slice(1)}T05:00:00Z` });

  it('menyertakan riwayat mapel untuk grafik dan status dari 3 kuis terakhir', () => {
    const d = susunDetailMapel({ kelas: KELAS, sesi: tiga, hasil: [hasil('s1', 5), hasil('s2', 4), hasil('s3', 4)] });
    expect(d.riwayat).toHaveLength(3);
    expect(d.statusMapel).toMatchObject({ status: 'aman', rataRata: 87 });
  });

  it('belum cukup data bila kuis di mapel kurang dari 3', () => {
    const d = susunDetailMapel({ kelas: KELAS, sesi: tiga.slice(0, 2), hasil: [hasil('s1', 5)] });
    expect(d.statusMapel.status).toBe('belum-cukup');
  });
});
