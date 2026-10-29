import { describe, expect, it } from 'vitest';
import {
  normalisasiKode,
  skemaBodyBagikanMateri,
  skemaBodyBukaSesi,
  skemaBodyBukaSesiBanyak,
  skemaBodyBuatKelas,
  skemaBodyBuatMateri,
  skemaBodyDaftarGuru,
  skemaBodyDaftarSiswa,
  skemaBodyGabungKelas,
  skemaBodyGabungSesi,
  skemaBodyHapusSiswa,
  skemaBodyHapusTopik,
  skemaBodyMasuk,
  skemaBodyTopikBaru,
  skemaBodyUbahTopik,
  skemaBodyFormat,
  skemaBodyJawaban,
  skemaBodyTutupSesi,
  skemaBodyUbahKelas,
  skemaBodyUbahMateri,
  skemaBodyUbahModul,
  skemaQueryHasil,
  skemaQueryDetailTopik,
  skemaQueryKelasOpsional,
  skemaQueryKelasSiswa,
  skemaQueryMateriGuru,
  skemaQueryMateriSiswa,
  skemaQuerySesi,
  skemaQuerySoal,
} from '@/lib/skema-api';

const SISWA_ID = '00000000-0000-4000-8000-000000000201';
const SESI_ID = '00000000-0000-4000-8000-000000000100';
const SOAL_ID = '00000000-0000-4000-8000-000000000301';

describe('normalisasiKode', () => {
  it('mengubah ke huruf kapital dan menghapus spasi', () => {
    expect(normalisasiKode(' a7k 2p ')).toBe('A7K2P');
  });
});

describe('skemaQuerySesi', () => {
  it('menerima kode yang ditulis kecil dengan spasi', () => {
    expect(skemaQuerySesi.parse({ kode: 'a7k 2p' })).toEqual({ kode: 'A7K2P' });
  });

  it('menerima kode riwayat 6 karakter', () => {
    expect(skemaQuerySesi.safeParse({ kode: 'RIW001' }).success).toBe(true);
  });

  it.each(['', 'A7K', 'A7K2P99', 'A7-2P'])('menolak kode tidak valid: "%s"', (kode) => {
    expect(skemaQuerySesi.safeParse({ kode }).success).toBe(false);
  });

  it('menolak jika kode tidak ada', () => {
    expect(skemaQuerySesi.safeParse({}).success).toBe(false);
  });
});

describe('skemaQuerySoal', () => {
  it('menerima uuid', () => {
    expect(skemaQuerySoal.safeParse({ sesi: SESI_ID }).success).toBe(true);
  });

  it('menolak bukan uuid', () => {
    expect(skemaQuerySoal.safeParse({ sesi: 'abc' }).success).toBe(false);
  });
});

describe('skemaBodyFormat', () => {
  it.each(['video', 'audio', 'bacaan', 'latihan'])('menerima format %s', (format) => {
    expect(skemaBodyFormat.safeParse({ sesiId: SESI_ID, format }).success).toBe(true);
  });

  it('menolak format lain', () => {
    expect(skemaBodyFormat.safeParse({ sesiId: SESI_ID, format: 'visual' }).success).toBe(false);
  });

  it('menolak tanpa sesiId karena identitas siswa berasal dari sesi login', () => {
    expect(skemaBodyFormat.safeParse({ siswaId: SISWA_ID, format: 'audio' }).success).toBe(false);
  });
});

describe('skemaBodyJawaban', () => {
  const valid = { sesiId: SESI_ID, jawaban: [{ soalId: SOAL_ID, pilihan: 'B' }] };

  it('menerima body yang valid', () => {
    expect(skemaBodyJawaban.safeParse(valid).success).toBe(true);
  });

  it('menolak jawaban kosong', () => {
    expect(skemaBodyJawaban.safeParse({ ...valid, jawaban: [] }).success).toBe(false);
  });

  it('menolak pilihan di luar A–D', () => {
    const body = { ...valid, jawaban: [{ soalId: SOAL_ID, pilihan: 'E' }] };
    expect(skemaBodyJawaban.safeParse(body).success).toBe(false);
  });

  it('tidak meneruskan field tambahan seperti siswaId atau benar dari browser', () => {
    const body = { ...valid, siswaId: SISWA_ID, jawaban: [{ soalId: SOAL_ID, pilihan: 'B', benar: true }] };
    const hasil = skemaBodyJawaban.parse(body);
    expect(hasil).toEqual(valid);
  });
});

describe('skemaBodyTutupSesi', () => {
  it('menerima sesiId uuid', () => {
    expect(skemaBodyTutupSesi.safeParse({ sesiId: SESI_ID }).success).toBe(true);
  });

  it.each([{}, { sesiId: 'bukan-uuid' }, undefined])('menolak body tidak valid: %j', (body) => {
    expect(skemaBodyTutupSesi.safeParse(body).success).toBe(false);
  });
});

describe('skemaQueryHasil', () => {
  it('menerima sesi uuid', () => {
    expect(skemaQueryHasil.parse({ sesi: SESI_ID })).toEqual({ sesi: SESI_ID });
  });

  it('menolak sesi kosong', () => {
    expect(skemaQueryHasil.safeParse({ sesi: '' }).success).toBe(false);
  });
});

describe('skemaQueryMateriGuru', () => {
  it('menerima sesi uuid dan menolak yang lain', () => {
    expect(skemaQueryMateriGuru.safeParse({ sesi: SESI_ID }).success).toBe(true);
    expect(skemaQueryMateriGuru.safeParse({ sesi: 'x' }).success).toBe(false);
  });
});

describe('skemaBodyBuatMateri', () => {
  it('menerima body minimal', () => {
    expect(skemaBodyBuatMateri.parse({ sesiId: SESI_ID })).toEqual({ sesiId: SESI_ID });
  });

  it('menerima gunakanCadangan dan ganti', () => {
    expect(skemaBodyBuatMateri.safeParse({ sesiId: SESI_ID, gunakanCadangan: true, ganti: true }).success).toBe(true);
  });

  it('menolak ganti yang bukan boolean', () => {
    expect(skemaBodyBuatMateri.safeParse({ sesiId: SESI_ID, ganti: 'ya' }).success).toBe(false);
  });
});

describe('skemaBodyUbahMateri', () => {
  const MATERI_ID = '00000000-0000-4000-8000-000000000401';

  it('menerima id, versi, dan isi apa pun (diperiksa terpisah)', () => {
    expect(skemaBodyUbahMateri.safeParse({ id: MATERI_ID, versi: 2, isi: { judul: 'x' } }).success).toBe(true);
  });

  it.each([0, -1, 1.5, '2'])('menolak versi tidak valid: %j', (versi) => {
    expect(skemaBodyUbahMateri.safeParse({ id: MATERI_ID, versi, isi: {} }).success).toBe(false);
  });
});

describe('skemaBodyBagikanMateri', () => {
  it('menerima sesiId uuid dan menolak yang lain', () => {
    expect(skemaBodyBagikanMateri.safeParse({ sesiId: SESI_ID }).success).toBe(true);
    expect(skemaBodyBagikanMateri.safeParse({}).success).toBe(false);
  });
});

describe('skemaQueryMateriSiswa', () => {
  it('membutuhkan sesi uuid dan mengabaikan siswa dari query', () => {
    expect(skemaQueryMateriSiswa.safeParse({ sesi: SESI_ID }).success).toBe(true);
    expect(skemaQueryMateriSiswa.parse({ sesi: SESI_ID, siswa: SISWA_ID })).toEqual({ sesi: SESI_ID });
    expect(skemaQueryMateriSiswa.safeParse({ sesi: '' }).success).toBe(false);
  });
});

describe('skemaBodyUbahModul (PRD F-9)', () => {
  const teks = (n: number) => 'a'.repeat(n);

  it.each([
    [199, false],
    [200, true],
    [8000, true],
    [8001, false],
  ])('panjang %i → %s', (n, lolos) => {
    expect(skemaBodyUbahModul.safeParse({ teks: teks(n) }).success).toBe(lolos);
  });

  it('panjang dihitung setelah spasi di awal dan akhir dibuang', () => {
    expect(skemaBodyUbahModul.parse({ teks: `  \n${teks(200)}\n  ` })).toEqual({ teks: teks(200) });
    expect(skemaBodyUbahModul.safeParse({ teks: `${' '.repeat(50)}${teks(199)}${' '.repeat(50)}` }).success).toBe(false);
  });

  it('menolak teks yang hilang atau bukan string', () => {
    expect(skemaBodyUbahModul.safeParse({}).success).toBe(false);
    expect(skemaBodyUbahModul.safeParse({ teks: 500 }).success).toBe(false);
    expect(skemaBodyUbahModul.safeParse(undefined).success).toBe(false);
  });
});

describe('skemaBodyTopikBaru (PRD F-10)', () => {
  const soalValid = () => ({
    teks: 'Pecahan yang senilai dengan 1/3 adalah …',
    pilihan: ['2/6', '1/6', '3/6', '2/3'],
    kunci: 'A',
    miskonsepsi: ['', 'Hanya mengalikan penyebut.', '', ''],
  });
  const bodyValid = () => ({
    nama: 'Pecahan Biasa',
    capaianPembelajaran: 'Peserta didik dapat membandingkan pecahan.',
    soal: [1, 2, 3, 4, 5].map(soalValid),
  });
  type Body = ReturnType<typeof bodyValid>;
  const dengan = (ubah: (b: Body) => void) => {
    const b = bodyValid();
    ubah(b);
    return skemaBodyTopikBaru.safeParse(b);
  };
  const jalurError = (hasil: ReturnType<typeof skemaBodyTopikBaru.safeParse>) =>
    hasil.success ? [] : hasil.error.issues.map((i) => i.path.join('.'));

  it('menerima body lengkap dan membuang spasi di awal dan akhir', () => {
    const hasil = dengan((b) => {
      b.nama = '  Pecahan Biasa  ';
      b.soal[0].pilihan[0] = ' 2/6 ';
    });
    expect(hasil.success).toBe(true);
    expect(hasil.data?.nama).toBe('Pecahan Biasa');
    expect(hasil.data?.soal[0].pilihan[0]).toBe('2/6');
  });

  it.each([
    ['nama 2 karakter', (b: Body) => void (b.nama = 'ab')],
    ['nama 81 karakter', (b: Body) => void (b.nama = 'a'.repeat(81))],
    ['nama hanya spasi', (b: Body) => void (b.nama = '     ')],
    ['capaian 9 karakter', (b: Body) => void (b.capaianPembelajaran = 'a'.repeat(9))],
    ['capaian 301 karakter', (b: Body) => void (b.capaianPembelajaran = 'a'.repeat(301))],
    ['teks soal 4 karakter', (b: Body) => void (b.soal[2].teks = 'abcd')],
    ['teks soal 301 karakter', (b: Body) => void (b.soal[2].teks = 'a'.repeat(301))],
    ['pilihan kosong', (b: Body) => void (b.soal[1].pilihan[3] = '')],
    ['pilihan hanya spasi', (b: Body) => void (b.soal[1].pilihan[3] = '   ')],
    ['pilihan 101 karakter', (b: Body) => void (b.soal[1].pilihan[0] = 'a'.repeat(101))],
    ['kunci E', (b: Body) => void (b.soal[0].kunci = 'E')],
    ['miskonsepsi 201 karakter', (b: Body) => void (b.soal[4].miskonsepsi[1] = 'a'.repeat(201))],
    ['hanya 3 pilihan', (b: Body) => void b.soal[0].pilihan.pop()],
  ])('menolak %s', (_, ubah) => {
    expect(dengan(ubah).success).toBe(false);
  });

  it.each([100, 1])('menerima batas: pilihan %i karakter', (n) => {
    expect(dengan((b) => void (b.soal[0].pilihan[0] = 'x'.repeat(n))).success).toBe(true);
  });

  it('menerima batas: nama 3 dan 80, capaian 10 dan 300, teks soal 5 dan 300, miskonsepsi 200', () => {
    for (const [nama, capaian, teks] of [
      ['abc', 'a'.repeat(10), 'abcde'],
      ['a'.repeat(80), 'a'.repeat(300), 'a'.repeat(300)],
    ]) {
      const hasil = dengan((b) => {
        b.nama = nama;
        b.capaianPembelajaran = capaian;
        b.soal[0].teks = teks;
        b.soal[0].miskonsepsi[1] = 'a'.repeat(200);
      });
      expect(hasil.success).toBe(true);
    }
  });

  it.each([1, 4, 6])('menerima jumlah soal %i', (n) => {
    expect(dengan((b) => void (b.soal = Array.from({ length: n }, soalValid))).success).toBe(true);
  });

  it('menolak topik tanpa soal', () => {
    expect(dengan((b) => void (b.soal = [])).success).toBe(false);
  });

  it.each([
    ['sama persis', '2/6'],
    ['beda spasi', ' 2/6  '],
    ['beda huruf besar-kecil', 'Dua per enam'],
  ])('menolak pilihan yang %s, dengan jalur error pada pilihan kembarannya', (_, kembar) => {
    const hasil = dengan((b) => {
      if (kembar === 'Dua per enam') b.soal[3].pilihan[0] = 'dua per enam';
      b.soal[3].pilihan[2] = kembar;
    });
    expect(hasil.success).toBe(false);
    expect(jalurError(hasil)).toEqual(['soal.3.pilihan.2']);
  });

  it('menolak body kosong', () => {
    expect(skemaBodyTopikBaru.safeParse(undefined).success).toBe(false);
    expect(skemaBodyTopikBaru.safeParse({}).success).toBe(false);
  });
});

describe('skema kelas', () => {
  it('menerima nama dan mapel yang wajar', () => {
    expect(skemaBodyBuatKelas.safeParse({ nama: 'Kelas 7A', mapel: 'Matematika' }).success).toBe(true);
  });

  it('menolak nama atau mapel terlalu pendek', () => {
    expect(skemaBodyBuatKelas.safeParse({ nama: '7A', mapel: 'Matematika' }).success).toBe(false);
    expect(skemaBodyBuatKelas.safeParse({ nama: 'Kelas 7A', mapel: 'MT' }).success).toBe(false);
  });

  it('query kelas boleh kosong tetapi harus uuid jika diisi', () => {
    expect(skemaQueryKelasOpsional.safeParse({}).success).toBe(true);
    expect(skemaQueryKelasOpsional.safeParse({ kelas: SESI_ID }).success).toBe(true);
    expect(skemaQueryKelasOpsional.safeParse({ kelas: '7a' }).success).toBe(false);
  });
});

describe('skemaBodyUbahKelas', () => {
  it('menerima perubahan nama, mapel, atau arsip', () => {
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID, nama: 'Kelas 7B' }).success).toBe(true);
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID, mapel: 'Biologi' }).success).toBe(true);
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID, arsip: true }).success).toBe(true);
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID, arsip: false }).success).toBe(true);
  });

  it('menolak body tanpa perubahan', () => {
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID }).success).toBe(false);
  });

  it('menolak nama atau mapel terlalu pendek', () => {
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID, nama: '7B' }).success).toBe(false);
    expect(skemaBodyUbahKelas.safeParse({ id: SESI_ID, mapel: 'BI' }).success).toBe(false);
  });

  it('menolak id bukan uuid', () => {
    expect(skemaBodyUbahKelas.safeParse({ id: '7a', arsip: true }).success).toBe(false);
  });
});

describe('skemaQueryKelasSiswa', () => {
  it('menerima kelas uuid dan menolak yang lain', () => {
    expect(skemaQueryKelasSiswa.safeParse({ kelas: SESI_ID }).success).toBe(true);
    expect(skemaQueryKelasSiswa.safeParse({ kelas: '' }).success).toBe(false);
    expect(skemaQueryKelasSiswa.safeParse({ kelas: '7a' }).success).toBe(false);
  });
});

describe('skemaBodyHapusSiswa', () => {
  it('menerima kelasId dan siswaId uuid', () => {
    expect(skemaBodyHapusSiswa.safeParse({ kelasId: SESI_ID, siswaId: SISWA_ID }).success).toBe(true);
  });

  it('menolak id yang tidak lengkap atau bukan uuid', () => {
    expect(skemaBodyHapusSiswa.safeParse({ kelasId: SESI_ID }).success).toBe(false);
    expect(skemaBodyHapusSiswa.safeParse({ kelasId: '7a', siswaId: SISWA_ID }).success).toBe(false);
    expect(skemaBodyHapusSiswa.safeParse({ kelasId: SESI_ID, siswaId: 'andi' }).success).toBe(false);
  });
});

describe('skema ubah/hapus/detail topik', () => {
  const soalUji = () => ({
    teks: 'Pecahan yang senilai dengan 1/2 adalah …',
    pilihan: ['2/4', '1/3', '3/5', '4/7'],
    kunci: 'A',
    miskonsepsi: ['', '', '', ''],
  });
  const bodyUbah = () => ({
    id: SESI_ID,
    nama: 'Topik Uji',
    capaianPembelajaran: 'Peserta didik dapat menguji topik.',
    soal: Array.from({ length: 5 }, soalUji),
  });

  it('menerima ubah topik dengan id dan soal', () => {
    expect(skemaBodyUbahTopik.safeParse(bodyUbah()).success).toBe(true);
  });

  it('menolak ubah topik tanpa id atau tanpa soal', () => {
    const tanpaId = { ...bodyUbah(), id: undefined };
    expect(skemaBodyUbahTopik.safeParse(tanpaId).success).toBe(false);
    expect(skemaBodyUbahTopik.safeParse({ ...bodyUbah(), soal: [] }).success).toBe(false);
  });

  it('hapus topik membutuhkan id uuid', () => {
    expect(skemaBodyHapusTopik.safeParse({ id: SESI_ID }).success).toBe(true);
    expect(skemaBodyHapusTopik.safeParse({ id: 'topik' }).success).toBe(false);
    expect(skemaBodyHapusTopik.safeParse({}).success).toBe(false);
  });

  it('detail topik membutuhkan query uuid', () => {
    expect(skemaQueryDetailTopik.safeParse({ topik: SESI_ID }).success).toBe(true);
    expect(skemaQueryDetailTopik.safeParse({ topik: '' }).success).toBe(false);
  });
});

describe('skemaBodyBukaSesi', () => {
  it('menerima tanpa id (bawaan kelas pertama dan topik demo) dan dengan uuid', () => {
    expect(skemaBodyBukaSesi.safeParse({}).success).toBe(true);
    expect(skemaBodyBukaSesi.safeParse({ topikId: SESI_ID }).success).toBe(true);
    expect(skemaBodyBukaSesi.safeParse({ kelasId: SESI_ID }).success).toBe(true);
  });

  it('menolak id yang bukan uuid', () => {
    expect(skemaBodyBukaSesi.safeParse({ topikId: 'pecahan' }).success).toBe(false);
    expect(skemaBodyBukaSesi.safeParse({ kelasId: '7a' }).success).toBe(false);
  });
});

describe('skemaBodyBukaSesiBanyak', () => {
  const KELAS_B = '00000000-0000-4000-8000-0000000000c2';

  it('menerima beberapa kelas unik dan topik opsional', () => {
    expect(skemaBodyBukaSesiBanyak.safeParse({ kelasIds: [SESI_ID, KELAS_B] }).success).toBe(true);
    expect(
      skemaBodyBukaSesiBanyak.safeParse({ kelasIds: [SESI_ID, KELAS_B], topikId: SESI_ID }).success,
    ).toBe(true);
  });

  it('menolak daftar kosong atau lebih dari 20 kelas', () => {
    expect(skemaBodyBukaSesiBanyak.safeParse({ kelasIds: [] }).success).toBe(false);
    expect(
      skemaBodyBukaSesiBanyak.safeParse({
        kelasIds: Array.from({ length: 21 }, () => SESI_ID),
      }).success,
    ).toBe(false);
  });

  it('menolak kelas yang dipilih dua kali', () => {
    const hasil = skemaBodyBukaSesiBanyak.safeParse({ kelasIds: [SESI_ID, SESI_ID] });
    expect(hasil.success).toBe(false);
    expect(hasil.success ? [] : hasil.error.issues[0]?.path).toEqual(['kelasIds']);
  });

  it('menolak id yang bukan uuid', () => {
    expect(skemaBodyBukaSesiBanyak.safeParse({ kelasIds: ['7a', KELAS_B] }).success).toBe(false);
  });
});

describe('skema autentikasi', () => {
  const valid = { nama: 'Budi Santoso', email: 'Budi@Example.com ', password: 'rahasia123' };

  it('menormalkan email saat masuk dan daftar', () => {
    expect(skemaBodyMasuk.parse({ email: ' Budi@Example.com ', password: 'x' })).toEqual({
      email: 'budi@example.com',
      password: 'x',
    });
    expect(skemaBodyDaftarSiswa.parse(valid).email).toBe('budi@example.com');
  });

  it('menolak kata sandi kurang dari 8 karakter saat mendaftar', () => {
    expect(skemaBodyDaftarSiswa.safeParse({ ...valid, password: 'pendek' }).success).toBe(false);
    expect(skemaBodyDaftarGuru.safeParse({ ...valid, kodeUndangan: 'ABC123' }).success).toBe(true);
  });

  it('menolak email tidak valid', () => {
    expect(skemaBodyDaftarSiswa.safeParse({ ...valid, email: 'bukan-email' }).success).toBe(false);
    expect(skemaBodyMasuk.safeParse({ email: 'bukan-email', password: 'x' }).success).toBe(false);
  });

  it('kode kelas opsional: string kosong menjadi undefined, kode dinormalkan', () => {
    expect(skemaBodyDaftarSiswa.parse({ ...valid, kodeKelas: '' }).kodeKelas).toBeUndefined();
    expect(skemaBodyDaftarSiswa.parse({ ...valid, kodeKelas: 'kel 7a' }).kodeKelas).toBe('KEL7A');
    expect(skemaBodyDaftarSiswa.safeParse({ ...valid, kodeKelas: 'XYZ' }).success).toBe(false);
  });

  it('kode undangan guru wajib diisi', () => {
    expect(skemaBodyDaftarGuru.safeParse({ ...valid, kodeUndangan: '' }).success).toBe(false);
    expect(skemaBodyDaftarGuru.safeParse({ ...valid }).success).toBe(false);
  });

  it('skemaBodyGabungSesi menormalkan kode dan menolak kode pendek', () => {
    expect(skemaBodyGabungSesi.parse({ kode: 'a7 k2p' })).toEqual({ kode: 'A7K2P' });
    expect(skemaBodyGabungSesi.safeParse({ kode: 'A7' }).success).toBe(false);
  });

  it('skemaBodyGabungKelas memakai aturan kode yang sama', () => {
    expect(skemaBodyGabungKelas.parse({ kode: 'kel 7a' })).toEqual({ kode: 'KEL7A' });
    expect(skemaBodyGabungKelas.safeParse({ kode: '' }).success).toBe(false);
    expect(skemaBodyGabungKelas.safeParse({}).success).toBe(false);
  });
});
