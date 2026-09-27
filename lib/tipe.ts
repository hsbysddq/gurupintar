// Tipe bersama untuk browser dan server. Nilai string mengikuti constraint di supabase/schema.sql.
import type { IsiMateri } from './validasi-materi';

export type { IsiMateri };

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

// ===== Respons API untuk guru (architecture.md bagian 6 dan 6.1) =====

/** GET /api/guru/sesi */
export interface SesiGuru {
  id: string;
  kodeKelas: string;
  status: StatusSesi;
  dibuatPada: string;
  jumlahMenjawab: number;
}

/** POST /api/guru/sesi */
export interface SesiBaru {
  id: string;
  kodeKelas: string;
}

export interface SiswaHasil {
  siswaId: string;
  nama: string;
  skor: number;
  total: number;
}

export interface SoalTersulit {
  nomor: number;
  teks: string;
  persenSalah: number;
  miskonsepsi: string | null;
}

export type StatusMateriSesi = 'belum-ada' | 'draf' | 'dibagikan' | 'campuran';

export interface RingkasanMateri {
  statusMateri: StatusMateriSesi;
  /** Kelompok berisi siswa tetapi belum punya materi (AC-5.7). */
  kelompokTanpaMateri: Kelompok[];
}

/** GET /api/guru/hasil */
export interface HasilGuru extends RingkasanMateri {
  sesi: {
    id: string;
    kodeKelas: string;
    status: StatusSesi;
    namaKelas: string;
    namaTopik: string;
    dibuatPada: string;
  };
  jumlahSiswa: number;
  jumlahMenjawab: number;
  kelompok: Record<Kelompok, SiswaHasil[]>;
  soalTersulit: SoalTersulit | null;
}

/** GET /api/soal, tanpa kunci dan miskonsepsi */
export interface SoalUntukSiswa {
  id: string;
  nomor: number;
  teks: string;
  pilihan: PilihanSoal[];
}

// ===== Materi (architecture.md bagian 6) =====

/** GET/POST /api/guru/materi */
export interface MateriGuru {
  id: string;
  kelompok: Kelompok;
  isi: IsiMateri;
  status: StatusMateri;
  sumber: SumberMateri;
  versi: number;
  jumlahSiswa: number;
}

/** GET /api/materi, tanpa kelompok dan sumber (D-2) */
export type MateriSiswa =
  | { status: 'belum-mengerjakan' }
  | { status: 'disiapkan' }
  | { status: 'tersedia'; namaTopik: string; isi: IsiMateri };
