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

// ===== Respons API untuk siswa (architecture.md bagian 6), tanpa data rahasia =====

export interface SiswaRingkas {
  id: string;
  nama: string;
}

/** GET /api/sesi */
export interface SesiUntukSiswa {
  sesi: {
    id: string;
    kodeKelas: string;
    status: StatusSesi;
    namaKelas: string;
    namaTopik: string;
  };
  siswa: SiswaRingkas[];
}

/** GET /api/soal, tanpa kunci dan miskonsepsi */
export interface SoalUntukSiswa {
  id: string;
  nomor: number;
  teks: string;
  pilihan: PilihanSoal[];
}
