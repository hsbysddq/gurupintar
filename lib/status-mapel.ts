// Status belajar siswa per mata pelajaran, mengikuti flowchart monitoring: ambil 3 kuis terakhir di satu mapel,
// hitung rata-rata nilainya (3 pengerjaan terakhir), lalu tentukan status. Tidak ada label kelompok (PRD D-2).

import { hitungPersen, type RiwayatKuis } from './riwayat-siswa';

export const JUMLAH_KUIS_PANTAUAN = 3;
/** Rata-rata di atas atau sama dengan batas ini = aman. */
export const BATAS_AMAN = 70;
/** Rata-rata di atas atau sama dengan batas ini (tetapi di bawah BATAS_AMAN) = batas aman. */
export const BATAS_BATAS_AMAN = 50;

export type StatusMapel = 'aman' | 'batas-aman' | 'tidak-aman' | 'tidak-mengerjakan' | 'belum-cukup';

export interface SesiMapel {
  sesiId: string;
  /** ISO 8601. */
  dibuatPada: string;
}

export interface HasilMapel {
  sesiId: string;
  skor: number;
  total: number;
  /** ISO 8601. */
  dikirimPada: string;
}

export interface HasilStatusMapel {
  status: StatusMapel;
  /** Rata-rata persen dari kuis yang dikerjakan di antara 3 kuis terakhir. null bila tidak ada. */
  rataRata: number | null;
  /** Berapa pengerjaan yang dihitung (maksimal 3). */
  dikerjakan: number;
}

/**
 * Status satu mapel dari 3 pengerjaan kuis terakhir (kuis yang dikerjakan ulang dihitung sebagai pengerjaan baru).
 * - Belum ada 3 pengerjaan: belum cukup data.
 * - Mapel sudah punya 3 kuis atau lebih tetapi siswa tidak pernah mengerjakan satu pun: tidak mengerjakan.
 * - Selain itu rata-rata: 70 ke atas aman, 50 sampai di bawah 70 batas aman, di bawah 50 tidak aman.
 */
export function hitungStatusMapel(sesi: SesiMapel[], hasil: HasilMapel[]): HasilStatusMapel {
  const terakhir = [...hasil].sort((a, b) => b.dikirimPada.localeCompare(a.dikirimPada)).slice(0, JUMLAH_KUIS_PANTAUAN);
  if (terakhir.length < JUMLAH_KUIS_PANTAUAN) {
    const tidakMengerjakan = hasil.length === 0 && sesi.length >= JUMLAH_KUIS_PANTAUAN;
    return { status: tidakMengerjakan ? 'tidak-mengerjakan' : 'belum-cukup', rataRata: null, dikerjakan: terakhir.length };
  }

  const persen = terakhir.map((h) => hitungPersen(h.skor, h.total));
  const rataRata = Math.round(persen.reduce((a, b) => a + b, 0) / persen.length);
  const status: StatusMapel = rataRata >= BATAS_AMAN ? 'aman' : rataRata >= BATAS_BATAS_AMAN ? 'batas-aman' : 'tidak-aman';
  return { status, rataRata, dikerjakan: persen.length };
}

export interface InfoStatusMapel {
  label: string;
  /** Kalimat untuk siswa: netral dan menyemangati. */
  pesan: string;
}

export function infoStatusMapel(status: StatusMapel): InfoStatusMapel {
  switch (status) {
    case 'aman':
      return { label: 'Aman', pesan: 'Nilai 3 kuis terakhirmu bagus. Pertahankan ya!' };
    case 'batas-aman':
      return { label: 'Batas aman', pesan: 'Nilaimu cukup, tapi masih bisa naik. Coba ulangi materi yang terasa sulit.' };
    case 'tidak-aman':
      return { label: 'Perlu perhatian', pesan: 'Nilai 3 kuis terakhirmu masih rendah. Gurumu siap membantu, ayo belajar lagi pelan-pelan.' };
    case 'tidak-mengerjakan':
      return { label: 'Belum mengerjakan', pesan: 'Kamu belum mengerjakan kuis di mapel ini. Ayo coba kerjakan kuis berikutnya.' };
    case 'belum-cukup':
      return { label: 'Belum cukup data', pesan: 'Status muncul setelah kamu mengerjakan kuis di mapel ini 3 kali.' };
  }
}

export interface MapelDiRiwayat {
  kelasId: string;
  namaMapel: string;
  namaKelas: string;
  sesi: SesiMapel[];
}

export interface PerformaMapel extends MapelDiRiwayat {
  riwayat: RiwayatKuis[];
  hasil: HasilStatusMapel;
}

/** Kelompokkan riwayat per mapel (per kelas). Mapel tanpa hasil tetap muncul bila sudah punya kuis. */
export function susunPerformaMapel(mapel: MapelDiRiwayat[], riwayat: RiwayatKuis[]): PerformaMapel[] {
  return mapel
    .filter((m) => m.sesi.length > 0 || riwayat.some((r) => r.kelasId === m.kelasId))
    .map((m) => {
      const milik = riwayat.filter((r) => r.kelasId === m.kelasId);
      return { ...m, riwayat: milik, hasil: hitungStatusMapel(m.sesi, milik) };
    })
    .sort((a, b) => a.namaMapel.localeCompare(b.namaMapel, 'id', { sensitivity: 'base' }));
}

/** Bentuk respons GET /api/siswa/riwayat. */
export interface ResponsRiwayat {
  riwayat: RiwayatKuis[];
  /** Mapel (kelas) yang diikuti beserta daftar kuisnya, untuk status 3 kuis terakhir per mapel. */
  mapel: MapelDiRiwayat[];
}
