// Tipe bersama untuk browser dan server. Nilai string mengikuti constraint di supabase/schema.sql.

export type Kelompok = 'sudah' | 'setengah' | 'belum';

export type Format = 'video' | 'audio' | 'bacaan' | 'latihan';

export type KodePilihan = 'A' | 'B' | 'C' | 'D';

export type StatusSesi = 'aktif' | 'selesai';

export type StatusMateri = 'draf' | 'dibagikan';

export type SumberMateri = 'ai' | 'cadangan';

export interface PilihanSoal {
  kode: KodePilihan;
  teks: string;
}
