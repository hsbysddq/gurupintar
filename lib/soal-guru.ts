import { SOAL_MINIMAL_TOPIK, TOPIK_DEMO_ID } from './konstanta';
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

type HasilValidasi =
  | { success: true }
  | { success: false; error: { issues: { path: PropertyKey[]; code: string; message: string }[] } };

/**
 * Pesan per kolom form Buat Soal dari hasil `skemaBodyTopikBaru.safeParse`, dikunci dengan jalur
 * seperti "soal.1.pilihan.2". Satu pesan (yang pertama) per kolom.
 */
export function pesanGalatTopik(hasil: HasilValidasi): Record<string, string> {
  if (hasil.success) return {};
  const pesan: Record<string, string> = {};
  for (const isu of hasil.error.issues) {
    const jalur = isu.path.map(String).join('.');
    if (!(jalur in pesan)) pesan[jalur] = pesanUntukKolom(isu.path.map(String), isu.code, isu.message);
  }
  return pesan;
}

function pesanUntukKolom(jalur: string[], code: string, message: string): string {
  const [akar, , kolom] = jalur;
  if (akar === 'nama') return 'Nama topik harus 3–80 karakter.';
  if (akar === 'capaianPembelajaran') return 'Capaian pembelajaran harus 10–300 karakter.';
  if (akar === 'soal' && jalur.length === 1) return `Tambahkan minimal ${SOAL_MINIMAL_TOPIK} soal.`;
  if (kolom === 'teks') return 'Teks soal harus 5–300 karakter.';
  // Pesan pilihan kembar ditulis sendiri di skema (bahasa Indonesia).
  if (kolom === 'pilihan') return code === 'custom' ? message : 'Pilihan harus diisi, maksimal 100 karakter.';
  if (kolom === 'kunci') return 'Pilih kunci jawaban.';
  if (kolom === 'miskonsepsi') return 'Miskonsepsi maksimal 200 karakter.';
  return 'Isian belum sesuai.';
}

/**
 * Daftar topik untuk pilihan di Dashboard: hanya topik yang bisa dipakai kuis (minimal satu soal),
 * sehingga topik yang soalnya gagal tersimpan tidak pernah muncul. Topik demo di atas, lalu urut nama.
 */
export function susunDaftarTopik(daftar: { id: string; nama: string; jumlahSoal: number }[]): TopikRingkas[] {
  return daftar
    .filter((t) => t.jumlahSoal >= SOAL_MINIMAL_TOPIK)
    .sort((a, b) => Number(b.id === TOPIK_DEMO_ID) - Number(a.id === TOPIK_DEMO_ID) || a.nama.localeCompare(b.nama, 'id'))
    .map(({ id, nama, jumlahSoal }) => ({ id, nama, jumlahSoal }));
}

/** Materi cadangan (data/materi-cadangan.json) hanya ditulis untuk topik demo Pecahan Senilai. */
export function cadanganTersedia(topikId: string): boolean {
  return topikId === TOPIK_DEMO_ID;
}
