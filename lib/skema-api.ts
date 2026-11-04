import { z } from 'zod';
import { PANJANG_SANDI_MAKS, PANJANG_SANDI_MIN, normalisasiEmail } from './auth';
import {
  PANJANG_MISKONSEPSI_MAKS,
  PANJANG_MODUL_MAKS,
  PANJANG_MODUL_MIN,
  SOAL_MINIMAL_TOPIK,
  UKURAN_PDF_MAKS_BYTE,
} from './konstanta';
import { samakanTeksPilihan } from './soal-guru';
import { skemaIsiMateri } from './validasi-materi';

/** AC-1.2: kode diubah ke huruf kapital dan spasi dihapus. */
export function normalisasiKode(kode: string): string {
  return kode.replace(/\s+/g, '').toUpperCase();
}

const skemaFormat = z.enum(['video', 'audio', 'bacaan', 'ppt']);
const skemaKodePilihan = z.enum(['A', 'B', 'C', 'D']);
const skemaEmail = z.string().trim().max(254).pipe(z.email()).transform(normalisasiEmail);
const skemaSandi = z.string().min(PANJANG_SANDI_MIN).max(PANJANG_SANDI_MAKS);
const skemaKodeKelas = z
  .string()
  .transform(normalisasiKode)
  .pipe(z.string().regex(/^[A-Z0-9]{5,6}$/));
const skemaKodeKelasOpsional = z.preprocess(
  (nilai) => (typeof nilai === 'string' && nilai.trim() === '' ? undefined : nilai),
  skemaKodeKelas.optional(),
);

const skemaGambarSoalOpsional = z.preprocess(
  (nilai) => (typeof nilai === 'string' && nilai.trim() === '' ? undefined : nilai === null ? undefined : nilai),
  z
    .string()
    .max(800_000, 'Gambar soal terlalu besar.')
    .refine(
      (nilai) => /^data:image\/(jpeg|png|webp);base64,/.test(nilai),
      'Gambar soal harus berupa gambar JPEG, PNG, atau WebP.',
    )
    .optional(),
);

// ===== Autentikasi =====

// POST /api/auth/masuk; panjang minimum tidak diperiksa agar pesan tidak membocorkan kebijakan sandi.
export const skemaBodyMasuk = z.object({
  email: skemaEmail,
  password: z.string().min(1).max(PANJANG_SANDI_MAKS),
});

// POST /api/auth/daftar-siswa; kode kelas boleh kosong, siswa dapat bergabung nanti lewat kode kuis.
export const skemaBodyDaftarSiswa = z.object({
  nama: z.string().trim().min(2).max(80),
  email: skemaEmail,
  password: skemaSandi,
  kodeKelas: skemaKodeKelasOpsional,
});

// POST /api/auth/daftar-guru; memerlukan kode undangan dari server.
export const skemaBodyDaftarGuru = z.object({
  nama: z.string().trim().min(2).max(80),
  email: skemaEmail,
  password: skemaSandi,
  kodeUndangan: z.string().trim().min(1).max(80),
  namaKelas: z.string().trim().min(3).max(80).optional(),
  mapel: z.string().trim().min(3).max(40).optional(),
});

// POST /api/guru/kelas
export const skemaBodyBuatKelas = z.object({
  nama: z.string().trim().min(3).max(80),
  mapel: z.string().trim().min(3).max(40),
  warna: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Warna harus berupa kode hex seperti #2563EB.')
    .optional(),
  sampul: z
    .string()
    .max(900_000, 'Foto sampul terlalu besar.')
    .refine(
      (nilai) => /^data:image\/(jpeg|png|webp);base64,/.test(nilai),
      'Foto sampul harus berupa gambar JPEG, PNG, atau WebP.',
    )
    .optional(),
});

// PATCH /api/guru/kelas: ubah nama/mapel atau arsipkan/pulihkan kelas.
export const skemaBodyUbahKelas = z
  .object({
    id: z.uuid(),
    nama: z.string().trim().min(3).max(80).optional(),
    mapel: z.string().trim().min(3).max(40).optional(),
    arsip: z.boolean().optional(),
  })
  .refine((data) => data.nama !== undefined || data.mapel !== undefined || data.arsip !== undefined, {
    message: 'Tidak ada perubahan yang dikirim.',
  });

// DELETE /api/guru/kelas/siswa
export const skemaBodyHapusSiswa = z.object({
  kelasId: z.uuid(),
  siswaId: z.uuid(),
});

// POST /api/sesi/gabung
export const skemaBodyGabungSesi = z.object({
  kode: skemaKodeKelas,
});

// POST /api/siswa/kelas: bergabung ke kelas lewat kode undangan, tanpa perlu kuis aktif.
export const skemaBodyGabungKelas = z.object({
  kode: skemaKodeKelas,
});

// GET /api/siswa/kelas/sesi?kelas=
export const skemaQueryKelasSiswa = z.object({
  kelas: z.uuid(),
});

// GET /api/sesi?kode=
export const skemaQuerySesi = z.object({
  kode: z.string().transform(normalisasiKode).pipe(z.string().regex(/^[A-Z0-9]{5,6}$/)),
});

// GET /api/soal?sesi=
export const skemaQuerySoal = z.object({
  sesi: z.uuid(),
});

// POST /api/siswa/format; siswa diambil dari sesi login, bukan dari body.
export const skemaBodyFormat = z.object({
  sesiId: z.uuid(),
  format: skemaFormat,
});

// POST /api/jawaban; siswa diambil dari sesi login, bukan dari body.
// Format detail `pilihan` diperiksa per tipe soal di server lewat `periksaDanNilaiJawaban`.
export const skemaBodyJawaban = z.object({
  sesiId: z.uuid(),
  jawaban: z
    .array(z.object({ soalId: z.uuid(), pilihan: z.string().trim().min(1).max(2000) }))
    .min(1),
});

// POST /api/guru/jawaban/nilai: guru menilai jawaban esai siswa (Benar / Salah).
export const skemaBodyNilaiEsai = z.object({
  sesiId: z.uuid(),
  siswaId: z.uuid(),
  soalId: z.uuid(),
  benar: z.boolean(),
});

// POST /api/siswa/pelanggaran: siswa meninggalkan halaman kuis; siswa diambil dari sesi login.
export const skemaBodyPelanggaran = z.object({ sesiId: z.uuid() });

// POST /api/guru/blokir: guru membuka blokir seorang siswa pada satu kuis.
export const skemaBodyBukaBlokir = z.object({ sesiId: z.uuid(), siswaId: z.uuid() });

// POST /api/guru/sesi/tutup
export const skemaBodyTutupSesi = z.object({
  sesiId: z.uuid(),
});

// GET /api/guru/hasil?sesi=
export const skemaQueryHasil = z.object({
  sesi: z.uuid(),
});

// GET /api/guru/materi?sesi=
export const skemaQueryMateriGuru = z.object({
  sesi: z.uuid(),
});

// POST /api/guru/materi
export const skemaBodyBuatMateri = z.object({
  sesiId: z.uuid(),
  gunakanCadangan: z.boolean().optional(),
  ganti: z.boolean().optional(),
});

// PATCH /api/guru/materi; `isi` diperiksa terpisah dengan periksaIsiMateri agar alasannya jelas.
export const skemaBodyUbahMateri = z.object({
  id: z.uuid(),
  versi: z.int().positive(),
  isi: z.unknown(),
});

// GET /api/guru/pendampingan?kelas=&sesi=
export const skemaQueryPendampingan = z.object({
  kelas: z.uuid().optional(),
  sesi: z.uuid().optional(),
});

// POST /api/guru/pendampingan/tindakan
export const skemaBodyTindakanPendampingan = z.object({
  kelasId: z.uuid(),
  sesiId: z.uuid(),
  siswaId: z.uuid(),
  tindakan: z.enum(['pendampingan', 'evaluasi', 'selesai']),
});

// POST /api/guru/materi-pustaka
export const skemaBodyMateriPustaka = z.object({
  kelasId: z.uuid(),
  bab: z.string().trim().min(1).max(80),
  judul: z.string().trim().min(5).max(80),
  isi: skemaIsiMateri,
  sumber: z.enum(['ai', 'cadangan']),
  asal: z.enum(['teks', 'pdf']),
});

// PATCH /api/guru/materi-pustaka
export const skemaBodyUbahMateriPustaka = z.object({
  id: z.uuid(),
  bab: z.string().trim().min(1).max(80),
  judul: z.string().trim().min(5).max(80),
  isi: skemaIsiMateri,
});

// POST /api/guru/materi/bagikan
export const skemaBodyBagikanMateri = z.object({
  sesiId: z.uuid(),
});

// GET /api/materi?sesi= (siswa diambil dari sesi login)
export const skemaQueryMateriSiswa = z.object({
  sesi: z.uuid(),
});

// POST /api/guru/modul; panjang dihitung setelah spasi di awal dan akhir dibuang.
export const skemaBodyUbahModul = z.object({
  teks: z.string().trim().min(PANJANG_MODUL_MIN).max(PANJANG_MODUL_MAKS),
});

// POST /api/guru/modul/pdf; PDF dikirim sebagai base64 (batas ukuran file diperiksa di route).
export const skemaBodyUbahModulPdf = z.object({
  pdf: z.string().min(100).max(Math.ceil((UKURAN_PDF_MAKS_BYTE * 4) / 3) + 8),
});

// Waktu jadwal dikirim sebagai ISO 8601. Nilai kosong berarti "buka sekarang" / "tanpa batas tutup".
const skemaWaktuIso = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .refine((nilai) => Number.isFinite(Date.parse(nilai)), 'Waktu jadwal tidak valid.')
  .transform((nilai) => new Date(nilai).toISOString());

const skemaWaktuIsoOpsional = z.preprocess(
  (nilai) => (typeof nilai === 'string' && nilai.trim() === '' ? undefined : nilai),
  skemaWaktuIso.optional(),
);

const skemaWaktuIsoNullable = z.preprocess(
  (nilai) => (typeof nilai === 'string' && nilai.trim() === '' ? null : nilai),
  skemaWaktuIso.nullable(),
);

// POST /api/guru/sesi; tanpa kelasId → kelas pertama milik guru, tanpa topikId → TOPIK_DEMO_ID.
export const skemaBodyBukaSesi = z.object({
  kelasId: z.uuid().optional(),
  topikId: z.uuid().optional(),
  bukaPada: skemaWaktuIsoOpsional,
  tutupPada: skemaWaktuIsoOpsional,
});

// POST /api/guru/sesi/banyak: satu topik untuk beberapa kelas sekaligus.
export const skemaBodyBukaSesiBanyak = z
  .object({
    kelasIds: z.array(z.uuid()).min(1).max(20),
    topikId: z.uuid().optional(),
    bukaPada: skemaWaktuIsoOpsional,
    tutupPada: skemaWaktuIsoOpsional,
  })
  .refine((data) => new Set(data.kelasIds).size === data.kelasIds.length, {
    path: ['kelasIds'],
    message: 'Kelas tidak boleh dipilih lebih dari sekali.',
  });

// PATCH /api/guru/sesi: atur ulang jadwal satu sesi.
export const skemaBodyJadwalSesi = z.object({
  sesiId: z.uuid(),
  bukaPada: skemaWaktuIsoOpsional,
  tutupPada: skemaWaktuIsoNullable,
});

// GET /api/guru/sesi?kelas= dan GET /api/guru/pendampingan?kelas=
export const skemaQueryKelasOpsional = z.object({
  kelas: z.uuid().optional(),
});

// ===== Bank Soal & Tipe Soal TKA (PRD F-10) =====

function periksaPilihanUnik(pilihan: readonly string[], ctx: z.RefinementCtx) {
  const terlihat = new Set<string>();
  pilihan.forEach((p, j) => {
    const kunci = samakanTeksPilihan(p);
    if (terlihat.has(kunci)) {
      ctx.addIssue({ code: 'custom', path: ['pilihan', j], message: 'Pilihan tidak boleh sama dengan pilihan lain.' });
    }
    terlihat.add(kunci);
  });
}

const skemaSoalPilgan = z
  .object({
    tipe: z.literal('pilgan'),
    teks: z.string().trim().min(5).max(300),
    gambar: skemaGambarSoalOpsional,
    pilihan: z.tuple([skemaTeksPilihan(), skemaTeksPilihan(), skemaTeksPilihan(), skemaTeksPilihan()]),
    kunci: skemaKodePilihan,
    miskonsepsi: z.tuple([
      skemaTeksMiskonsepsi(),
      skemaTeksMiskonsepsi(),
      skemaTeksMiskonsepsi(),
      skemaTeksMiskonsepsi(),
    ]),
  })
  .superRefine((soal, ctx) => {
    periksaPilihanUnik(soal.pilihan, ctx);
  });

const skemaSoalPilganKompleks = z
  .object({
    tipe: z.literal('pilgan_kompleks'),
    teks: z.string().trim().min(5).max(300),
    gambar: skemaGambarSoalOpsional,
    pilihan: z.tuple([skemaTeksPilihan(), skemaTeksPilihan(), skemaTeksPilihan(), skemaTeksPilihan()]),
    kunciKompleks: z
      .array(skemaKodePilihan)
      .min(2, 'Pilih minimal 2 kunci jawaban yang benar.')
      .max(4)
      .refine((daftar) => new Set(daftar).size === daftar.length, {
        message: 'Kunci jawaban tidak boleh kembar.',
      }),
    miskonsepsi: z
      .tuple([
        skemaTeksMiskonsepsi(),
        skemaTeksMiskonsepsi(),
        skemaTeksMiskonsepsi(),
        skemaTeksMiskonsepsi(),
      ])
      .optional(),
  })
  .superRefine((soal, ctx) => {
    periksaPilihanUnik(soal.pilihan, ctx);
  });

const skemaSoalBenarSalah = z
  .object({
    tipe: z.literal('benar_salah'),
    teks: z.string().trim().min(5).max(300),
    gambar: skemaGambarSoalOpsional,
    pernyataan: z
      .array(
        z.object({
          teks: z.string().trim().min(1).max(200),
          kunci: z.enum(['B', 'S']),
        }),
      )
      .min(2)
      .max(5),
    catatanMiskonsepsi: skemaTeksMiskonsepsi().optional(),
  })
  .superRefine((soal, ctx) => {
    const terlihat = new Set<string>();
    soal.pernyataan.forEach((p, j) => {
      const kunci = samakanTeksPilihan(p.teks);
      if (kunci && terlihat.has(kunci)) {
        ctx.addIssue({
          code: 'custom',
          path: ['pernyataan', j, 'teks'],
          message: 'Pernyataan tidak boleh sama dengan pernyataan lain.',
        });
      }
      if (kunci) terlihat.add(kunci);
    });
  });

const skemaSoalIsianSingkat = z
  .object({
    tipe: z.literal('isian_singkat'),
    teks: z.string().trim().min(5).max(300),
    gambar: skemaGambarSoalOpsional,
    jawabanSingkat: z.array(z.string().trim().min(1).max(100)).min(1).max(5),
    catatanMiskonsepsi: skemaTeksMiskonsepsi().optional(),
  })
  .superRefine((soal, ctx) => {
    const terlihat = new Set<string>();
    soal.jawabanSingkat.forEach((jwb, j) => {
      const kunci = samakanTeksPilihan(jwb);
      if (kunci && terlihat.has(kunci)) {
        ctx.addIssue({
          code: 'custom',
          path: ['jawabanSingkat', j],
          message: 'Variasi jawaban tidak boleh sama dengan variasi lain.',
        });
      }
      if (kunci) terlihat.add(kunci);
    });
  });

const skemaSoalMenjodohkan = z
  .object({
    tipe: z.literal('menjodohkan'),
    teks: z.string().trim().min(5).max(300),
    gambar: skemaGambarSoalOpsional,
    pasangan: z
      .array(
        z.object({
          kiri: z.string().trim().min(1).max(120),
          kanan: z.string().trim().min(1).max(120),
        }),
      )
      .min(2)
      .max(5),
    catatanMiskonsepsi: skemaTeksMiskonsepsi().optional(),
  })
  .superRefine((soal, ctx) => {
    const lihatKiri = new Set<string>();
    const lihatKanan = new Set<string>();
    soal.pasangan.forEach((p, j) => {
      const k1 = samakanTeksPilihan(p.kiri);
      const k2 = samakanTeksPilihan(p.kanan);
      if (k1 && lihatKiri.has(k1)) {
        ctx.addIssue({
          code: 'custom',
          path: ['pasangan', j, 'kiri'],
          message: 'Bagian kiri tidak boleh sama dengan baris lain.',
        });
      }
      if (k2 && lihatKanan.has(k2)) {
        ctx.addIssue({
          code: 'custom',
          path: ['pasangan', j, 'kanan'],
          message: 'Pasangan kanan tidak boleh sama dengan baris lain.',
        });
      }
      if (k1) lihatKiri.add(k1);
      if (k2) lihatKanan.add(k2);
    });
  });

const skemaSoalEsai = z.object({
  tipe: z.literal('esai'),
  teks: z.string().trim().min(5).max(300),
  gambar: skemaGambarSoalOpsional,
  pedomanJawaban: z.string().trim().max(500).optional(),
  catatanMiskonsepsi: skemaTeksMiskonsepsi().optional(),
});

// Tanpa `tipe`, soal dianggap pilihan ganda biasa (kompatibel dengan data & tes lama).
const skemaSoalBaru = z.preprocess(
  (nilai) =>
    typeof nilai === 'object' && nilai !== null && !('tipe' in nilai)
      ? { ...(nilai as Record<string, unknown>), tipe: 'pilgan' }
      : nilai,
  z.discriminatedUnion('tipe', [
    skemaSoalPilgan,
    skemaSoalPilganKompleks,
    skemaSoalBenarSalah,
    skemaSoalIsianSingkat,
    skemaSoalMenjodohkan,
    skemaSoalEsai,
  ]),
);

export const skemaBodyTopikBaru = z.object({
  nama: z.string().trim().min(3).max(80),
  capaianPembelajaran: z.string().trim().min(10).max(300),
  soal: z.array(skemaSoalBaru).min(SOAL_MINIMAL_TOPIK),
});

// PATCH /api/guru/topik
export const skemaBodyUbahTopik = skemaBodyTopikBaru.extend({
  id: z.uuid(),
});

// DELETE /api/guru/topik
export const skemaBodyHapusTopik = z.object({
  id: z.uuid(),
});

// GET /api/guru/topik/detail?topik=
export const skemaQueryDetailTopik = z.object({
  topik: z.uuid(),
});

function skemaTeksPilihan() {
  return z.string().trim().min(1).max(100);
}

function skemaTeksMiskonsepsi() {
  return z.string().trim().max(PANJANG_MISKONSEPSI_MAKS);
}

export type BodyFormat = z.infer<typeof skemaBodyFormat>;
export type BodyJawaban = z.infer<typeof skemaBodyJawaban>;
export type BodyNilaiEsai = z.infer<typeof skemaBodyNilaiEsai>;
export type BodyPelanggaran = z.infer<typeof skemaBodyPelanggaran>;
export type BodyBukaBlokir = z.infer<typeof skemaBodyBukaBlokir>;
export type BodyBuatMateri = z.infer<typeof skemaBodyBuatMateri>;
export type BodyTindakanPendampingan = z.infer<typeof skemaBodyTindakanPendampingan>;
export type BodyMateriPustaka = z.infer<typeof skemaBodyMateriPustaka>;
export type BodyUbahMateriPustaka = z.infer<typeof skemaBodyUbahMateriPustaka>;
export type BodyTopikBaru = z.infer<typeof skemaBodyTopikBaru>;
export type BodyUbahTopik = z.infer<typeof skemaBodyUbahTopik>;
export type BodyMasuk = z.infer<typeof skemaBodyMasuk>;
export type BodyDaftarSiswa = z.infer<typeof skemaBodyDaftarSiswa>;
export type BodyDaftarGuru = z.infer<typeof skemaBodyDaftarGuru>;
export type BodyBuatKelas = z.infer<typeof skemaBodyBuatKelas>;
export type BodyUbahKelas = z.infer<typeof skemaBodyUbahKelas>;
export type BodyHapusSiswa = z.infer<typeof skemaBodyHapusSiswa>;
export type BodyBukaSesiBanyak = z.infer<typeof skemaBodyBukaSesiBanyak>;
export type BodyJadwalSesi = z.infer<typeof skemaBodyJadwalSesi>;
/** Nilai form sebelum validasi (kunci belum dipilih = string kosong). */
export type IsianTopikBaru = z.input<typeof skemaBodyTopikBaru>;
export type SoalTervalidasi = BodyTopikBaru['soal'][number];
