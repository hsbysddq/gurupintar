// Logika murni untuk dashboard performa siswa. Sengaja tanpa label kelompok (PRD D-2): siswa hanya
// melihat skor, persentase, dan tren, tidak pernah "Belum/Setengah/Sudah Paham".

export interface RiwayatKuis {
  sesiId: string;
  /** Kelas tempat kuis ini, untuk tautan ke halaman mata pelajarannya. */
  kelasId?: string;
  /** Nama mata pelajaran kelas ini (mis. Matematika). */
  namaMapel?: string;
  /** ISO 8601, waktu jawaban dikirim. */
  dikirimPada: string;
  namaKelas: string;
  namaTopik: string;
  skor: number;
  total: number;
}

export interface RingkasanPerforma {
  jumlahKuis: number;
  /** Persen 0–100, dibulatkan. null jika belum ada kuis. */
  rataRata: number | null;
  terbaik: number | null;
  /** Selisih poin persen kuis terakhir terhadap kuis sebelumnya. null jika kurang dari dua kuis. */
  perubahan: number | null;
}

export interface TitikGrafik {
  label: string;
  persen: number;
  judul: string;
  skor: number;
  total: number;
}

export function hitungPersen(skor: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((skor / total) * 100);
}

/** Urutkan dari yang terlama ke terbaru (untuk grafik). */
export function urutkanLama(daftar: RiwayatKuis[]): RiwayatKuis[] {
  return [...daftar].sort((a, b) => a.dikirimPada.localeCompare(b.dikirimPada));
}

export function ringkasPerforma(daftar: RiwayatKuis[]): RingkasanPerforma {
  if (daftar.length === 0) return { jumlahKuis: 0, rataRata: null, terbaik: null, perubahan: null };
  const urut = urutkanLama(daftar);
  const persen = urut.map((k) => hitungPersen(k.skor, k.total));
  const rataRata = Math.round(persen.reduce((a, b) => a + b, 0) / persen.length);
  const terbaik = Math.max(...persen);
  const perubahan = persen.length >= 2 ? persen[persen.length - 1] - persen[persen.length - 2] : null;
  return { jumlahKuis: persen.length, rataRata, terbaik, perubahan };
}

export function formatTanggalPendek(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function formatTanggalPanjang(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function titikGrafik(daftar: RiwayatKuis[]): TitikGrafik[] {
  return urutkanLama(daftar).map((k) => ({
    label: formatTanggalPendek(k.dikirimPada),
    persen: hitungPersen(k.skor, k.total),
    judul: k.namaTopik,
    skor: k.skor,
    total: k.total,
  }));
}

/** Kalimat tren yang netral untuk siswa. */
export function kalimatTren(perubahan: number | null): string {
  if (perubahan === null) return 'Kerjakan satu kuis lagi untuk melihat naik turunnya nilaimu.';
  if (perubahan > 0) return `Naik ${perubahan} poin dari kuis sebelumnya. Pertahankan ya!`;
  if (perubahan < 0) return `Turun ${Math.abs(perubahan)} poin dari kuis sebelumnya. Tidak apa-apa, coba lagi di kuis berikutnya.`;
  return 'Nilaimu sama dengan kuis sebelumnya.';
}
