import { JUMLAH_SOAL_TOPIK, TOPIK_DEMO_ID } from './konstanta';
import type { KodePilihan, PilihanSoal, TopikRingkas } from './tipe';

export const KODE_PILIHAN: readonly KodePilihan[] = ['A', 'B', 'C', 'D'];

/** Satu soal dari form Buat Soal (PRD F-10); `pilihan` dan `miskonsepsi` berurutan A–D. */
export interface SoalBaru {
  teks: string;
  pilihan: [string, string, string, string];
  kunci: KodePilihan;
  /** String kosong = tidak ada miskonsepsi untuk pilihan itu. */
  miskonsepsi: [string, string, string, string];
}

/** Baris tabel `soal` (supabase/schema.sql). */
export interface BarisSoalBaru {
  topik_id: string;
  nomor: number;
  teks: string;
  pilihan: PilihanSoal[];
  kunci: KodePilihan;
  miskonsepsi: Partial<Record<KodePilihan, string>>;
}

/** Bentuk pembanding untuk mendeteksi pilihan kembar: tanpa spasi berlebih dan tanpa beda huruf besar-kecil. */
export function samakanTeksPilihan(teks: string): string {
  return teks.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Mengubah soal dari form menjadi baris tabel `soal`: nomor 1..n, pilihan berkode, miskonsepsi tanpa kunci. */
export function keBarisSoal(topikId: string, daftar: SoalBaru[]): BarisSoalBaru[] {
  return daftar.map((s, i) => {
    const miskonsepsi: BarisSoalBaru['miskonsepsi'] = {};
    KODE_PILIHAN.forEach((kode, j) => {
      const teks = s.miskonsepsi[j].trim();
      if (kode !== s.kunci && teks) miskonsepsi[kode] = teks;
    });
    return {
      topik_id: topikId,
      nomor: i + 1,
      teks: s.teks.trim(),
      pilihan: KODE_PILIHAN.map((kode, j) => ({ kode, teks: s.pilihan[j].trim() })),
      kunci: s.kunci,
      miskonsepsi,
    };
  });
}

/**
 * Daftar topik untuk pilihan di Dashboard: hanya topik yang bisa dipakai kuis (tepat 5 soal), sehingga
 * topik yang soalnya gagal tersimpan tidak pernah muncul. Topik demo di atas, lalu urut nama.
 */
export function susunDaftarTopik(daftar: { id: string; nama: string; jumlahSoal: number }[]): TopikRingkas[] {
  return daftar
    .filter((t) => t.jumlahSoal === JUMLAH_SOAL_TOPIK)
    .sort((a, b) => Number(b.id === TOPIK_DEMO_ID) - Number(a.id === TOPIK_DEMO_ID) || a.nama.localeCompare(b.nama, 'id'))
    .map(({ id, nama }) => ({ id, nama }));
}

/** Materi cadangan (data/materi-cadangan.json) hanya ditulis untuk topik demo Pecahan Senilai. */
export function cadanganTersedia(topikId: string): boolean {
  return topikId === TOPIK_DEMO_ID;
}
