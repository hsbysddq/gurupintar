import { z } from 'zod';
import { JUMLAH_SOAL_TOPIK, PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN } from './konstanta';
import { samakanTeksPilihan } from './soal-guru';

/** AC-1.2: kode diubah ke huruf kapital dan spasi dihapus. */
export function normalisasiKode(kode: string): string {
  return kode.replace(/\s+/g, '').toUpperCase();
}

const skemaFormat = z.enum(['video', 'audio', 'bacaan', 'latihan']);
const skemaKodePilihan = z.enum(['A', 'B', 'C', 'D']);

// GET /api/sesi?kode=
export const skemaQuerySesi = z.object({
  kode: z.string().transform(normalisasiKode).pipe(z.string().regex(/^[A-Z0-9]{5,6}$/)),
});

// GET /api/soal?sesi=
export const skemaQuerySoal = z.object({
  sesi: z.uuid(),
});

// POST /api/siswa/format
export const skemaBodyFormat = z.object({
  siswaId: z.uuid(),
  format: skemaFormat,
});

// POST /api/jawaban
export const skemaBodyJawaban = z.object({
  sesiId: z.uuid(),
  siswaId: z.uuid(),
  jawaban: z
    .array(z.object({ soalId: z.uuid(), pilihan: skemaKodePilihan }))
    .min(1),
});

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

// POST /api/guru/materi/bagikan
export const skemaBodyBagikanMateri = z.object({
  sesiId: z.uuid(),
});

// GET /api/materi?sesi=&siswa=
export const skemaQueryMateriSiswa = z.object({
  sesi: z.uuid(),
  siswa: z.uuid(),
});

// POST /api/guru/modul; panjang dihitung setelah spasi di awal dan akhir dibuang.
export const skemaBodyUbahModul = z.object({
  teks: z.string().trim().min(PANJANG_MODUL_MIN).max(PANJANG_MODUL_MAKS),
});

// POST /api/guru/sesi; tanpa topikId → TOPIK_DEMO_ID.
export const skemaBodyBukaSesi = z.object({
  topikId: z.uuid().optional(),
});

// POST /api/guru/topik (PRD F-10). Pilihan kembar dibandingkan dengan samakanTeksPilihan.
const skemaSoalBaru = z
  .object({
    teks: z.string().trim().min(5).max(300),
    pilihan: z.tuple([skemaTeksPilihan(), skemaTeksPilihan(), skemaTeksPilihan(), skemaTeksPilihan()]),
    kunci: skemaKodePilihan,
    miskonsepsi: z.tuple([skemaTeksMiskonsepsi(), skemaTeksMiskonsepsi(), skemaTeksMiskonsepsi(), skemaTeksMiskonsepsi()]),
  })
  .superRefine((soal, ctx) => {
    const terlihat = new Set<string>();
    soal.pilihan.forEach((p, j) => {
      const kunci = samakanTeksPilihan(p);
      if (terlihat.has(kunci)) {
        ctx.addIssue({ code: 'custom', path: ['pilihan', j], message: 'Pilihan tidak boleh sama dengan pilihan lain.' });
      }
      terlihat.add(kunci);
    });
  });

export const skemaBodyTopikBaru = z.object({
  nama: z.string().trim().min(3).max(80),
  capaianPembelajaran: z.string().trim().min(10).max(300),
  soal: z.array(skemaSoalBaru).length(JUMLAH_SOAL_TOPIK),
});

function skemaTeksPilihan() {
  return z.string().trim().min(1).max(100);
}

function skemaTeksMiskonsepsi() {
  return z.string().trim().max(200);
}

export type BodyFormat = z.infer<typeof skemaBodyFormat>;
export type BodyJawaban = z.infer<typeof skemaBodyJawaban>;
export type BodyBuatMateri = z.infer<typeof skemaBodyBuatMateri>;
export type BodyTopikBaru = z.infer<typeof skemaBodyTopikBaru>;
/** Nilai form sebelum validasi (kunci belum dipilih = string kosong). */
export type IsianTopikBaru = z.input<typeof skemaBodyTopikBaru>;
