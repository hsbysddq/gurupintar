// Logika murni pemantauan kuis: menghitung berapa kali siswa meninggalkan halaman kuis (pindah tab, membuka
// aplikasi lain, atau keluar dari browser). Deteksi ini hanya di browser siswa, jadi tidak bisa dijadikan bukti
// mutlak dan tidak menyentuh data penilaian.

/** Pelanggaran ke-N memblokir kuis. Peringatan diberikan sebelum itu. */
export const BATAS_PELANGGARAN = 3;
/** Satu perpindahan tab memicu beberapa kejadian browser (visibilitychange dan blur); yang berdekatan dihitung sekali. */
export const JEDA_ABAIKAN_MS = 1000;

export interface CatatanPelanggaran {
  jumlah: number;
  /** Waktu (ms sejak epoch) pelanggaran terakhir; 0 bila belum ada. */
  terakhirPada: number;
}

export const CATATAN_KOSONG: CatatanPelanggaran = { jumlah: 0, terakhirPada: 0 };

export function terblokir(catatan: CatatanPelanggaran): boolean {
  return catatan.jumlah >= BATAS_PELANGGARAN;
}

/** Berapa pelanggaran lagi sebelum kuis diblokir (tidak pernah di bawah 0). */
export function sisaKesempatan(catatan: CatatanPelanggaran): number {
  return Math.max(0, BATAS_PELANGGARAN - catatan.jumlah);
}

/**
 * Mencatat satu kejadian meninggalkan halaman. Kejadian yang terlalu dekat dengan sebelumnya, atau yang datang
 * setelah kuis terblokir, tidak dihitung (`dicatat: false`).
 */
export function catatPelanggaran(
  catatan: CatatanPelanggaran,
  sekarang: number,
): { catatan: CatatanPelanggaran; dicatat: boolean } {
  if (terblokir(catatan)) return { catatan, dicatat: false };
  if (catatan.jumlah > 0 && sekarang - catatan.terakhirPada < JEDA_ABAIKAN_MS) return { catatan, dicatat: false };
  return { catatan: { jumlah: catatan.jumlah + 1, terakhirPada: sekarang }, dicatat: true };
}

export function kunciPenyimpanan(sesiId: string): string {
  return `gp-pelanggaran:${sesiId}`;
}

/** Membaca catatan tersimpan; data rusak atau tidak masuk akal dianggap kosong. */
export function uraiCatatan(mentah: string | null): CatatanPelanggaran {
  if (!mentah) return CATATAN_KOSONG;
  try {
    const data: unknown = JSON.parse(mentah);
    if (typeof data !== 'object' || data === null) return CATATAN_KOSONG;
    const { jumlah, terakhirPada } = data as Record<string, unknown>;
    if (typeof jumlah !== 'number' || !Number.isInteger(jumlah) || jumlah < 0) return CATATAN_KOSONG;
    return { jumlah: Math.min(jumlah, BATAS_PELANGGARAN), terakhirPada: typeof terakhirPada === 'number' ? terakhirPada : 0 };
  } catch {
    return CATATAN_KOSONG;
  }
}

export function pesanPeringatan(catatan: CatatanPelanggaran): string {
  const sisa = sisaKesempatan(catatan);
  return `Kami mendeteksi kamu membuka tab lain atau keluar dari halaman kuis. Ini indikasi kecurangan ${catatan.jumlah} dari ${BATAS_PELANGGARAN}. Jika sampai ${BATAS_PELANGGARAN} kali, kuismu diblokir (sisa ${sisa} kali).`;
}

/** Baris tabel blokir_kuis untuk satu siswa di satu kuis. */
export interface KeadaanBlokir {
  /** Pelanggaran pada percobaan saat ini; kembali ke 0 saat guru membuka blokir. */
  jumlah: number;
  terblokir: boolean;
  /** Berapa kali siswa ini pernah diblokir di kuis ini. */
  jumlahBlokir: number;
}

export const BLOKIR_KOSONG: KeadaanBlokir = { jumlah: 0, terblokir: false, jumlahBlokir: 0 };

/**
 * Menambah satu pelanggaran di sisi server. Siswa yang sudah terblokir tidak bertambah lagi.
 * `baruDiblokir` true hanya pada pelanggaran yang mencapai batas.
 */
export function tambahPelanggaranServer(keadaan: KeadaanBlokir | null): { keadaan: KeadaanBlokir; baruDiblokir: boolean } {
  const awal = keadaan ?? BLOKIR_KOSONG;
  if (awal.terblokir) return { keadaan: awal, baruDiblokir: false };
  const jumlah = awal.jumlah + 1;
  const baruDiblokir = jumlah >= BATAS_PELANGGARAN;
  return {
    keadaan: { jumlah, terblokir: baruDiblokir, jumlahBlokir: awal.jumlahBlokir + (baruDiblokir ? 1 : 0) },
    baruDiblokir,
  };
}

/** Guru membuka blokir: hitungan pelanggaran kembali ke 0 dan siswa boleh mengerjakan lagi. Riwayat blokir tetap. */
export function bukaBlokirServer(keadaan: KeadaanBlokir): KeadaanBlokir {
  return { jumlah: 0, terblokir: false, jumlahBlokir: keadaan.jumlahBlokir };
}
