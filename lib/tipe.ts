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

export type Format = 'ppt' | 'audio' | 'bacaan' | 'latihan';

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
export interface KuisAktifRingkas {
  id: string;
  kodeKelas: string;
  jumlahMenjawab: number;
}

export interface KelasRingkas {
  id: string;
  nama: string;
  mapel: string;
  kodeUndangan: string;
  jumlahSiswa: number;
  /** Sesi aktif kelas ini, jika ada. */
  kuisAktif: KuisAktifRingkas | null;
}

/** Anggota kelas beserta hasil terbarunya (untuk tab Siswa). */
export interface SiswaKelas {
  siswaId: string;
  nama: string;
  email: string | null;
  format: Format | null;
  kelompok: Kelompok | null;
  skor: number | null;
  total: number | null;
}

/** Ringkasan satu kelas untuk halaman lintas kelas. */
export interface RingkasanKelas {
  id: string;
  nama: string;
  mapel: string;
  jumlahSiswa: number;
  kuisAktif: KuisAktifRingkas | null;
  jumlahPerluPendampingan: number;
  jumlahSesi: number;
  sesiTerakhir: string | null;
}

/** GET /api/siswa/kelas */
export interface KelasSiswa {
  id: string;
  nama: string;
  mapel: string;
  namaGuru: string;
  kodeUndangan: string;
  kuisAktif: { kodeKelas: string } | null;
}

export type StatusMateriSiswa = 'belum-mengerjakan' | 'disiapkan' | 'tersedia';

/** GET /api/siswa/kelas/sesi */
export interface SesiSiswa {
  id: string;
  kodeKelas: string;
  status: StatusSesi;
  dibuatPada: string;
  namaTopik: string;
  statusMateri: StatusMateriSiswa;
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

/** GET /api/guru/topik: hanya topik dengan minimal satu soal */
export interface TopikRingkas {
  id: string;
  nama: string;
  jumlahSoal: number;
}

/** GET /api/guru/topik/detail */
export interface SoalTopikDetail {
  nomor: number;
  teks: string;
  pilihan: PilihanSoal[];
  kunci: KodePilihan;
  miskonsepsi: Partial<Record<KodePilihan, string>>;
}

export interface TopikDetail {
  id: string;
  nama: string;
  capaianPembelajaran: string;
  soal: SoalTopikDetail[];
  dipakai: boolean;
}

/** POST /api/guru/sesi */
export interface SesiBaru {
  id: string;
  kodeKelas: string;
}

/** POST /api/guru/sesi/banyak */
export interface SesiBanyakBaru {
  sesi: { kelasId: string; namaKelas: string; id: string; kodeKelas: string }[];
  gagal: { kelasId: string; namaKelas: string; pesan: string }[];
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

export type AsalMateriPustaka = 'teks' | 'pdf';

/** Satu materi mandiri di pustaka kelas (hasil Ubah Modul). */
export interface MateriPustaka {
  id: string;
  kelasId: string;
  bab: string;
  judul: string;
  isi: IsiMateri;
  sumber: SumberMateri;
  asal: AsalMateriPustaka;
  dibuatPada: string;
  diperbaruiPada: string;
}

/** GET /api/materi, tanpa kelompok dan sumber (D-2) */
export type MateriSiswa =
  | { status: 'belum-mengerjakan' }
  | { status: 'disiapkan' }
  | { status: 'tersedia'; namaTopik: string; isi: IsiMateri; format: Format | null };

// ===== Pendampingan berbasis rata-rata 3 kuis selesai terakhir =====

export type KategoriPemahaman = 'paham' | 'setengah' | 'belum' | 'tidak-mengerjakan' | 'belum-cukup';

export type StatusPendampingan =
  | 'belum-cukup'
  | 'paham'
  | 'menunggu'
  | 'pendampingan'
  | 'evaluasi'
  | 'selesai';

export type TindakanPendampingan = 'pendampingan' | 'evaluasi' | 'selesai';

export interface SiswaPendampingan {
  siswaId: string;
  nama: string;
  kategori: KategoriPemahaman;
  /** Rata-rata persentase 3 kuis; null jika belum lengkap. */
  rataRata: number | null;
  jumlahDikerjakan: number;
  jumlahKuis: number;
  status: StatusPendampingan;
  sesiTerakhirId: string | null;
}

/** GET /api/guru/pendampingan */
export interface RingkasanPendampingan {
  jumlahSiswa: number;
  jumlahSesi: number;
  jumlahSesiSelesai: number;
  jumlahSesiBerjawaban: number;
  butuhSesi: number;
  jumlahPaham: number;
  jumlahSetengah: number;
  jumlahBelum: number;
  jumlahTidakMengerjakan: number;
  /** True jika tabel tindakan_pendampingan belum dibuat. */
  perluMigrasi?: boolean;
}

export interface DataPendampingan {
  siswa: SiswaPendampingan[];
  ringkasan: RingkasanPendampingan;
}
