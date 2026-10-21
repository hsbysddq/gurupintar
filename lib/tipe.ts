// Tipe bersama untuk browser dan server. Nilai string mengikuti constraint di supabase/schema.sql.
import type { IsiMateri } from './validasi-materi';

export type { IsiMateri };

export type Peran = 'guru' | 'siswa';

export interface Profil {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
}

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

/** POST /api/sesi/gabung */
export interface SesiUntukSiswa {
  sesi: {
    id: string;
    kodeKelas: string;
    status: StatusSesi;
    kelasId: string;
    namaKelas: string;
    namaTopik: string;
  };
}

// ===== Respons API untuk guru (architecture.md bagian 6 dan 6.1) =====

/** GET /api/guru/kelas */
export interface KelasRingkas {
  id: string;
  nama: string;
  mapel: string;
  kodeUndangan: string;
  jumlahSiswa: number;
}

/** GET /api/guru/sesi */
export interface SesiGuru {
  id: string;
  kelasId: string;
  namaKelas: string;
  kodeKelas: string;
  status: StatusSesi;
  dibuatPada: string;
  jumlahMenjawab: number;
}

/** GET /api/guru/topik: hanya topik dengan tepat 5 soal */
export interface TopikRingkas {
  id: string;
  nama: string;
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
    /** Materi cadangan hanya ada untuk topik demo (PRD F-10). */
    cadanganTersedia: boolean;
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

// ===== Perlu pendampingan (architecture.md bagian 6, hanya untuk guru) =====

export interface SiswaPerluPendampingan {
  siswaId: string;
  nama: string;
  alasan: string[];
  saran: string[];
  trenSkor: number[];
}

export interface SiswaKemajuan {
  siswaId: string;
  nama: string;
  dari: Kelompok;
  ke: Kelompok;
}

/** GET /api/guru/pendampingan */
export interface DataPendampingan {
  perluPendampingan: SiswaPerluPendampingan[];
  kemajuan: SiswaKemajuan[];
}
