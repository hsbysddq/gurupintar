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

export type Format = 'video' | 'audio' | 'bacaan' | 'ppt' | 'latihan';

export type KodePilihan = 'A' | 'B' | 'C' | 'D';

export type TipeSoal =
  | 'pilgan'
  | 'pilgan_kompleks'
  | 'benar_salah'
  | 'isian_singkat'
  | 'menjodohkan'
  | 'esai';

/** `terjadwal` adalah status tampilan dari jadwal; kolom database tetap `aktif` sampai ditutup. */
export type StatusSesi = 'aktif' | 'selesai' | 'terjadwal';

export type StatusMateri = 'draf' | 'dibagikan';

export type SumberMateri = 'ai' | 'cadangan';

export interface PilihanSoal {
  kode: KodePilihan;
  teks: string;
}

export interface ButirPilihan {
  kode: string;
  teks: string;
}

export interface PilihanMenjodohkan {
  kiri: ButirPilihan[];
  kanan: ButirPilihan[];
}

export type DataPilihanSoal = PilihanSoal[] | ButirPilihan[] | PilihanMenjodohkan;

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
    bukaPada: string | null;
    tutupPada: string | null;
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
  /** Warna aksen kartu (hex) dan foto sampul (data URL), opsional. */
  warna: string | null;
  sampul: string | null;
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
  /** Kuis dengan indikasi kecurangan siswa (kosong bila tidak ada). */
  blokir: BlokirSiswaKelas[];
}

/** Indikasi kecurangan seorang siswa pada satu kuis (untuk tab Siswa). */
export interface BlokirSiswaKelas {
  sesiId: string;
  namaKuis: string;
  /** Jumlah kejadian meninggalkan halaman kuis pada percobaan ini. */
  jumlah: number;
  terblokir: boolean;
  jumlahBlokir: number;
  diblokirPada: string | null;
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
  kuisAktif: { kodeKelas: string; tutupPada: string | null } | null;
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
  bukaPada?: string | null;
  tutupPada?: string | null;
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
  bukaPada: string | null;
  tutupPada: string | null;
}

/** Model yang bisa dipilih untuk fitur AI (Ubah Modul dan materi lanjutan). */
export interface ModelAi {
  id: string;
  name: string;
  grup: string;
  contextLength: number | null;
}

/** GET /api/guru/model-ai */
export interface DaftarModelAi {
  modelDefault: string;
  daftar: ModelAi[];
}

/** GET /api/guru/koin */
export interface KoinGuru {
  koin: number;
  biayaModul: number;
  whatsappAdmin: string | null;
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
  tipe: TipeSoal;
  teks: string;
  gambar: string | null;
  pilihan: DataPilihanSoal;
  kunci: string;
  miskonsepsi: Record<string, string>;
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
  bukaPada: string | null;
  tutupPada: string | null;
}

/** POST /api/guru/sesi/banyak */
export interface SesiBanyakBaru {
  sesi: {
    kelasId: string;
    namaKelas: string;
    id: string;
    kodeKelas: string;
    bukaPada: string | null;
    tutupPada: string | null;
  }[];
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

/** Siswa yang terindikasi meninggalkan halaman kuis (hanya terlihat oleh guru). */
export interface SiswaDiblokirGuru {
  siswaId: string;
  nama: string;
  /** Jumlah kejadian meninggalkan halaman kuis pada percobaan ini. */
  jumlah: number;
  terblokir: boolean;
  /** Berapa kali siswa ini pernah diblokir di kuis ini. */
  jumlahBlokir: number;
  /** ISO 8601. */
  diblokirPada: string | null;
}

/** POST /api/siswa/pelanggaran */
export interface HasilPelanggaran {
  jumlah: number;
  terblokir: boolean;
}

/** Jawaban esai siswa untuk dinilai guru pada halaman Hasil. */
export interface JawabanEsaiGuru {
  soalId: string;
  nomorSoal: number;
  teksSoal: string;
  gambarSoal: string | null;
  pedomanJawaban: string | null;
  siswaId: string;
  namaSiswa: string;
  jawabanTeks: string;
  belumDinilai: boolean;
  benar: boolean;
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
    bukaPada: string | null;
    tutupPada: string | null;
    /** Materi cadangan hanya ada untuk topik demo (PRD F-10). */
    cadanganTersedia: boolean;
  };
  jumlahSiswa: number;
  jumlahMenjawab: number;
  diblokir: SiswaDiblokirGuru[];
  esai: JawabanEsaiGuru[];
  kelompok: Record<Kelompok, SiswaHasil[]>;
  soalTersulit: SoalTersulit | null;
}

/** GET /api/soal, tanpa kunci dan miskonsepsi */
export interface SoalUntukSiswa {
  id: string;
  nomor: number;
  tipe: TipeSoal;
  teks: string;
  gambar: string | null;
  pilihan: DataPilihanSoal;
}

/** GET /api/siswa/hasil: rincian jawaban percobaan terakhir pada satu kuis. */
export interface RincianJawabanSiswa {
  sesi: {
    id: string;
    kelasId: string;
    namaKelas: string;
    namaMapel: string;
    namaTopik: string;
    dikirimPada: string;
  };
  skor: number;
  total: number;
  soal: {
    id: string;
    nomor: number;
    tipe: TipeSoal;
    teks: string;
    gambar: string | null;
    pilihan: DataPilihanSoal;
    pilihanSiswa: string | null;
    kunci: string;
    benar: boolean;
    belumDinilai: boolean;
  }[];
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

export interface SesiPendampingan {
  id: string;
  kodeKelas: string;
  dibuatPada: string;
  namaTopik: string;
}

export interface SiswaPendampingan {
  siswaId: string;
  nama: string;
  kategori: KategoriPemahaman;
  /** Persentase nilai pada kuis terpilih; null jika tidak mengerjakan. */
  nilai: number | null;
  status: StatusPendampingan;
  sesiId: string | null;
}

/** GET /api/guru/pendampingan */
export interface RingkasanPendampingan {
  jumlahSiswa: number;
  jumlahSesiSelesai: number;
  jumlahMenjawab: number;
  sesiTerpilihId: string | null;
  daftarSesi: SesiPendampingan[];
  jumlahPaham: number;
  jumlahSetengah: number;
  jumlahBelum: number;
  jumlahTidakMengerjakan: number;
  /** True jika tabel tindakan_pendampingan_kuis belum dibuat. */
  perluMigrasi?: boolean;
}

export interface DataPendampingan {
  siswa: SiswaPendampingan[];
  ringkasan: RingkasanPendampingan;
}
