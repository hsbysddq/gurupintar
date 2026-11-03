import { PANJANG_MISKONSEPSI_MAKS, SOAL_MINIMAL_TOPIK, TOPIK_DEMO_ID } from './konstanta';
import {
  normalisasiBenarSalah,
  normalisasiPilganKompleks,
  simpanKunciIsianSingkat,
  susunPilihanMenjodohkan,
} from './soal-tka';
import type { DataPilihanSoal, KodePilihan, TipeSoal, TopikRingkas } from './tipe';

export const KODE_PILIHAN: readonly KodePilihan[] = ['A', 'B', 'C', 'D'];

export interface SoalPilganBaru {
  tipe?: 'pilgan';
  teks: string;
  gambar?: string;
  pilihan: [string, string, string, string];
  kunci: KodePilihan;
  /** String kosong = tidak ada miskonsepsi untuk pilihan itu. */
  miskonsepsi: [string, string, string, string];
}

export interface SoalPilganKompleksBaru {
  tipe: 'pilgan_kompleks';
  teks: string;
  gambar?: string;
  pilihan: [string, string, string, string];
  kunciKompleks: KodePilihan[];
  miskonsepsi?: [string, string, string, string];
}

export interface SoalBenarSalahBaru {
  tipe: 'benar_salah';
  teks: string;
  gambar?: string;
  pernyataan: { teks: string; kunci: 'B' | 'S' }[];
  catatanMiskonsepsi?: string;
}

export interface SoalIsianSingkatBaru {
  tipe: 'isian_singkat';
  teks: string;
  gambar?: string;
  jawabanSingkat: string[];
  catatanMiskonsepsi?: string;
}

export interface SoalMenjodohkanBaru {
  tipe: 'menjodohkan';
  teks: string;
  gambar?: string;
  pasangan: { kiri: string; kanan: string }[];
  catatanMiskonsepsi?: string;
}

export interface SoalEsaiBaru {
  tipe: 'esai';
  teks: string;
  gambar?: string;
  pedomanJawaban?: string;
  catatanMiskonsepsi?: string;
}

/** Satu soal dari form Buat Soal (PRD F-10 & TKA). */
export type SoalBaru =
  | SoalPilganBaru
  | SoalPilganKompleksBaru
  | SoalBenarSalahBaru
  | SoalIsianSingkatBaru
  | SoalMenjodohkanBaru
  | SoalEsaiBaru;

/** Baris tabel `soal` (supabase/schema.sql). */
export interface BarisSoalBaru {
  topik_id: string;
  nomor: number;
  tipe: TipeSoal;
  teks: string;
  gambar: string | null;
  pilihan: DataPilihanSoal;
  kunci: string;
  miskonsepsi: Record<string, string>;
}

/** Bentuk pembanding untuk mendeteksi pilihan kembar: tanpa spasi berlebih dan tanpa beda huruf besar-kecil. */
export function samakanTeksPilihan(teks: string): string {
  return teks.trim().replace(/\s+/g, ' ').toLowerCase();
}

function miskonsepsiUmum(catatan: string | undefined): Record<string, string> {
  const rapi = catatan?.trim() ?? '';
  return rapi ? { umum: rapi } : {};
}

/** Mengubah soal dari form menjadi baris tabel `soal`: nomor 1..n, pilihan sesuai tipe, miskonsepsi tanpa kunci. */
export function keBarisSoal(topikId: string, daftar: SoalBaru[]): BarisSoalBaru[] {
  return daftar.map((s, i) => {
    const nomor = i + 1;
    const teks = s.teks.trim();
    const gambar = s.gambar?.trim() ? s.gambar.trim() : null;
    const tipe: TipeSoal = s.tipe ?? 'pilgan';

    if (tipe === 'pilgan') {
      const sp = s as SoalPilganBaru;
      const miskonsepsi: Record<string, string> = {};
      KODE_PILIHAN.forEach((kode, j) => {
        const alasan = sp.miskonsepsi[j].trim();
        if (kode !== sp.kunci && alasan) miskonsepsi[kode] = alasan;
      });
      return {
        topik_id: topikId,
        nomor,
        tipe: 'pilgan',
        teks,
        gambar,
        pilihan: KODE_PILIHAN.map((kode, j) => ({ kode, teks: sp.pilihan[j].trim() })),
        kunci: sp.kunci,
        miskonsepsi,
      };
    }

    if (tipe === 'pilgan_kompleks') {
      const spk = s as SoalPilganKompleksBaru;
      const setKunci = new Set(spk.kunciKompleks);
      const miskonsepsi: Record<string, string> = {};
      if (spk.miskonsepsi) {
        KODE_PILIHAN.forEach((kode, j) => {
          const alasan = spk.miskonsepsi?.[j]?.trim() ?? '';
          if (!setKunci.has(kode) && alasan) miskonsepsi[kode] = alasan;
        });
      }
      return {
        topik_id: topikId,
        nomor,
        tipe: 'pilgan_kompleks',
        teks,
        gambar,
        pilihan: KODE_PILIHAN.map((kode, j) => ({ kode, teks: spk.pilihan[j].trim() })),
        kunci: normalisasiPilganKompleks(spk.kunciKompleks),
        miskonsepsi,
      };
    }

    if (tipe === 'benar_salah') {
      const sbs = s as SoalBenarSalahBaru;
      return {
        topik_id: topikId,
        nomor,
        tipe: 'benar_salah',
        teks,
        gambar,
        pilihan: sbs.pernyataan.map((p, idx) => ({ kode: String(idx + 1), teks: p.teks.trim() })),
        kunci: normalisasiBenarSalah(sbs.pernyataan.map((p) => p.kunci)),
        miskonsepsi: miskonsepsiUmum(sbs.catatanMiskonsepsi),
      };
    }

    if (tipe === 'isian_singkat') {
      const sis = s as SoalIsianSingkatBaru;
      return {
        topik_id: topikId,
        nomor,
        tipe: 'isian_singkat',
        teks,
        gambar,
        pilihan: [],
        kunci: simpanKunciIsianSingkat(sis.jawabanSingkat),
        miskonsepsi: miskonsepsiUmum(sis.catatanMiskonsepsi),
      };
    }

    if (tipe === 'menjodohkan') {
      const sm = s as SoalMenjodohkanBaru;
      const disusun = susunPilihanMenjodohkan(sm.pasangan);
      return {
        topik_id: topikId,
        nomor,
        tipe: 'menjodohkan',
        teks,
        gambar,
        pilihan: disusun.pilihan,
        kunci: disusun.kunci,
        miskonsepsi: miskonsepsiUmum(sm.catatanMiskonsepsi),
      };
    }

    const se = s as SoalEsaiBaru;
    return {
      topik_id: topikId,
      nomor,
      tipe: 'esai',
      teks,
      gambar,
      pilihan: [],
      kunci: se.pedomanJawaban?.trim() ?? '',
      miskonsepsi: miskonsepsiUmum(se.catatanMiskonsepsi),
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
  const [akar, , kolom, , subKolom] = jalur;
  if (akar === 'nama') return 'Nama topik harus 3–80 karakter.';
  if (akar === 'capaianPembelajaran') return 'Capaian pembelajaran harus 10–300 karakter.';
  if (akar === 'soal' && jalur.length === 1) return `Tambahkan minimal ${SOAL_MINIMAL_TOPIK} soal.`;
  if (kolom === 'teks') return 'Teks soal harus 5–300 karakter.';
  if (kolom === 'gambar') return 'Gambar harus JPEG, PNG, atau WebP dan ukuran wajar.';
  // Pesan pilihan kembar ditulis sendiri di skema (bahasa Indonesia).
  if (kolom === 'pilihan') return code === 'custom' ? message : 'Pilihan harus diisi, maksimal 100 karakter.';
  if (kolom === 'kunci') return 'Pilih kunci jawaban.';
  if (kolom === 'kunciKompleks') return 'Pilih minimal 2 kunci jawaban yang benar.';
  if (kolom === 'pernyataan') {
    if (jalur.length === 3) return 'Tambahkan minimal 2 pernyataan.';
    if (subKolom === 'teks') return code === 'custom' ? message : 'Pernyataan harus diisi, maksimal 200 karakter.';
    if (subKolom === 'kunci') return 'Pilih Benar atau Salah.';
  }
  if (kolom === 'jawabanSingkat') {
    if (jalur.length === 3) return 'Isi minimal 1 jawaban yang diterima.';
    return code === 'custom' ? message : 'Jawaban singkat harus diisi, maksimal 100 karakter.';
  }
  if (kolom === 'pasangan') {
    if (jalur.length === 3) return 'Tambahkan minimal 2 pasangan.';
    return code === 'custom' ? message : 'Bagian kiri dan kanan pasangan harus diisi, maksimal 120 karakter.';
  }
  if (kolom === 'pedomanJawaban') return 'Pedoman jawaban maksimal 500 karakter.';
  if (kolom === 'miskonsepsi' || kolom === 'catatanMiskonsepsi') {
    return `Miskonsepsi maksimal ${PANJANG_MISKONSEPSI_MAKS} karakter.`;
  }
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
