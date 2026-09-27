import { z } from 'zod';

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

export type BodyFormat = z.infer<typeof skemaBodyFormat>;
export type BodyJawaban = z.infer<typeof skemaBodyJawaban>;
export type BodyBuatMateri = z.infer<typeof skemaBodyBuatMateri>;
