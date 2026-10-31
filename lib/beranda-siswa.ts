// Logika murni untuk beranda siswa. Semua angka dihitung dari data nyata di database, tanpa data contoh.
// Kelompok hanya dipakai di server untuk menghitung jumlah; yang dikirim ke tampilan hanya angka ringkasan.

import type { Kelompok } from './tipe';

export interface KelasBeranda {
  id: string;
  nama: string;
  mapel: string;
  namaGuru: string;
}

export interface SesiBeranda {
  id: string;
  kelasId: string;
  /** Kode kuis jika sesi ini sedang aktif; kosong jika sudah selesai. */
  kodeAktif?: string | null;
}

/** Satu pengerjaan kuis. Kuis yang dikerjakan ulang punya beberapa baris dengan `sesiId` yang sama. */
export interface HasilBeranda {
  sesiId: string;
  kelompok: Kelompok;
  skor: number;
  total: number;
  /** ISO 8601, waktu jawaban dikirim. */
  dikirimPada: string;
  namaTopik: string;
}

export interface DataBeranda {
  kelas: KelasBeranda[];
  sesi: SesiBeranda[];
  hasil: HasilBeranda[];
}

export interface ProgresKelas {
  id: string;
  nama: string;
  mapel: string;
  namaGuru: string;
  /** Jumlah kuis di kelas ini. */
  jumlahKuis: number;
  /** Jumlah kuis (bukan jumlah pengerjaan) yang sudah dikerjakan siswa. */
  dikerjakan: number;
  /** Persen 0–100; 0 jika kelas belum punya kuis. */
  progres: number;
  /** Kode kuis yang sedang aktif di kelas ini, atau null. */
  kodeKuisAktif: string | null;
}

export interface AktivitasTerakhir {
  sesiId: string;
  namaTopik: string;
  mapel: string;
  skor: number;
  total: number;
  dikirimPada: string;
}

export interface RingkasanBeranda {
  /** Kelas yang sedang difilter, atau null untuk semua kelas. */
  kelasId: string | null;
  jumlahKelas: number;
  /** Jumlah mata pelajaran berbeda dari kelas yang diikuti. */
  totalMapel: number;
  /** Satu materi = satu kuis (topik) di kelas yang diikuti. */
  totalMateri: number;
  materi: { belum: number; sedang: number; sudah: number; belumMengerjakan: number };
  soal: { benar: number; salah: number; total: number };
  /** Persen 0–100 dibulatkan; 0 jika belum ada soal yang dijawab. */
  akurasi: number;
  kelas: ProgresKelas[];
  aktivitas: AktivitasTerakhir[];
}

const BATAS_AKTIVITAS = 3;
const ZONA_WAKTU = 'Asia/Jakarta';

export function hitungPersen(bagian: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((bagian / total) * 100);
}

/**
 * Meringkas beranda siswa.
 * - Paham: hasil kelompok "sudah". Sedang Belajar: hasil kelompok "setengah".
 * - Belum Paham: kuis yang sudah dikerjakan dengan hasil kelompok "belum".
 * - Belum Mengerjakan: kuis yang belum punya hasil pengerjaan.
 * - Kuis yang dikerjakan ulang: kelompok dan status dikerjakan mengikuti pengerjaan terakhir, sedangkan soal
 *   benar dan salah dijumlahkan dari semua pengerjaan, jadi hasil pertama tetap terhitung.
 */
export function hitungBeranda(data: DataBeranda, kelasId?: string | null): RingkasanBeranda {
  const dipilih = kelasId && data.kelas.some((k) => k.id === kelasId) ? kelasId : null;
  const kelas = dipilih ? data.kelas.filter((k) => k.id === dipilih) : data.kelas;
  const idKelas = new Set(kelas.map((k) => k.id));

  const sesi = data.sesi.filter((s) => idKelas.has(s.kelasId));
  const kelasPerSesi = new Map(sesi.map((s) => [s.id, s.kelasId]));
  const hasil = data.hasil.filter((h) => kelasPerSesi.has(h.sesiId));

  // Pengerjaan terakhir tiap kuis menentukan kelompok; semua pengerjaan ikut dihitung untuk soal dan aktivitas.
  const terakhirPerSesi = new Map<string, HasilBeranda>();
  for (const h of hasil) {
    const lama = terakhirPerSesi.get(h.sesiId);
    if (!lama || h.dikirimPada > lama.dikirimPada) terakhirPerSesi.set(h.sesiId, h);
  }
  const terakhir = [...terakhirPerSesi.values()];

  const sudah = terakhir.filter((h) => h.kelompok === 'sudah').length;
  const sedang = terakhir.filter((h) => h.kelompok === 'setengah').length;
  const belumMengerjakan = Math.max(0, sesi.length - terakhir.length);
  const belum = terakhir.filter((h) => h.kelompok === 'belum').length;

  const benar = hasil.reduce((jumlah, h) => jumlah + h.skor, 0);
  const totalSoal = hasil.reduce((jumlah, h) => jumlah + h.total, 0);

  const dikerjakanPerKelas = new Map<string, number>();
  for (const h of terakhir) {
    const id = kelasPerSesi.get(h.sesiId)!;
    dikerjakanPerKelas.set(id, (dikerjakanPerKelas.get(id) ?? 0) + 1);
  }
  const kuisPerKelas = new Map<string, number>();
  for (const s of sesi) kuisPerKelas.set(s.kelasId, (kuisPerKelas.get(s.kelasId) ?? 0) + 1);

  const mapelKelas = new Map(kelas.map((k) => [k.id, k.mapel]));
  const aktivitas = [...hasil]
    .sort((a, b) => b.dikirimPada.localeCompare(a.dikirimPada))
    .slice(0, BATAS_AKTIVITAS)
    .map((h) => ({
      sesiId: h.sesiId,
      namaTopik: h.namaTopik,
      mapel: mapelKelas.get(kelasPerSesi.get(h.sesiId)!) ?? '',
      skor: h.skor,
      total: h.total,
      dikirimPada: h.dikirimPada,
    }));

  return {
    kelasId: dipilih,
    jumlahKelas: kelas.length,
    totalMapel: new Set(kelas.map((k) => k.mapel.trim().toLowerCase())).size,
    totalMateri: sesi.length,
    materi: { belum, sedang, sudah, belumMengerjakan },
    soal: { benar, salah: totalSoal - benar, total: totalSoal },
    akurasi: hitungPersen(benar, totalSoal),
    kelas: kelas.map((k) => {
      const jumlahKuis = kuisPerKelas.get(k.id) ?? 0;
      const dikerjakan = dikerjakanPerKelas.get(k.id) ?? 0;
      return {
        id: k.id,
        nama: k.nama,
        mapel: k.mapel,
        namaGuru: k.namaGuru,
        jumlahKuis,
        dikerjakan,
        progres: hitungPersen(dikerjakan, jumlahKuis),
        kodeKuisAktif: sesi.find((s) => s.kelasId === k.id && s.kodeAktif)?.kodeAktif ?? null,
      };
    }),
    aktivitas,
  };
}

function kunciHari(tanggal: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_WAKTU }).format(tanggal);
}

/** "Hari ini", "Kemarin", atau tanggal pendek, dihitung menurut waktu Indonesia Barat. */
export function labelHari(iso: string, sekarang: Date = new Date()): string {
  const tanggal = new Date(iso);
  const hari = kunciHari(tanggal);
  if (hari === kunciHari(sekarang)) return 'Hari ini';
  if (hari === kunciHari(new Date(sekarang.getTime() - 24 * 60 * 60 * 1000))) return 'Kemarin';
  return tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: ZONA_WAKTU });
}

/** "7A" menjadi "Kelas 7A"; nama yang sudah berawalan "Kelas" dibiarkan agar tidak tertulis dua kali. */
export function labelKelas(nama: string): string {
  const bersih = nama.trim();
  return /^kelas\b/i.test(bersih) ? bersih : `Kelas ${bersih}`;
}

/** Indeks warna yang stabil untuk satu id (hash sederhana), supaya satu mapel selalu berwarna sama. */
export function indeksWarna(id: string, jumlah: number): number {
  if (jumlah <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % jumlah;
}

export function namaDepan(nama: string): string {
  return nama.trim().split(/\s+/)[0] ?? '';
}
