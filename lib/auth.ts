import type { Peran } from './tipe';

export const PANJANG_SANDI_MIN = 8;
export const PANJANG_SANDI_MAKS = 72;

export const PESAN_MASUK_DIPERLUKAN = 'Silakan masuk terlebih dahulu.';
export const PESAN_AKSES_DITOLAK = 'Halaman ini tidak tersedia untuk akunmu.';
export const PESAN_KREDENSIAL_SALAH = 'Email atau kata sandi salah.';

const PETA_TUJUAN: Record<Peran, '/guru' | '/siswa'> = {
  guru: '/guru',
  siswa: '/siswa',
};

/** Halaman awal sesuai peran. Peran selalu berasal dari server, bukan pilihan di browser. */
export function tujuanSetelahMasuk(peran: Peran): '/guru' | '/siswa' {
  return PETA_TUJUAN[peran];
}

/** Membaca peran dari metadata Supabase Auth; `null` jika tidak dikenal. */
export function peranDariMetadata(metadata: unknown): Peran | null {
  if (typeof metadata !== 'object' || metadata === null || !('peran' in metadata)) return null;
  const peran = metadata.peran;
  return peran === 'guru' || peran === 'siswa' ? peran : null;
}

/**
 * Memvalidasi tujuan setelah login. Hanya path internal di area peran tersebut yang diterima,
 * sehingga parameter `lanjut` tidak bisa dipakai untuk redirect ke domain lain (open redirect).
 */
export function lanjutAman(lanjut: string | null | undefined, peran: Peran): string {
  const bawaan = tujuanSetelahMasuk(peran);
  if (!lanjut) return bawaan;
  if (!lanjut.startsWith('/') || lanjut.startsWith('//') || lanjut.includes('\\')) return bawaan;
  if (lanjut.includes('..')) return bawaan;

  const area = peran === 'guru' ? /^\/guru(?:\/|\?|#|$)/ : /^\/siswa(?:\/|\?|#|$)/;
  return area.test(lanjut) ? lanjut : bawaan;
}

export function normalisasiEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Kode undangan guru dibandingkan persis; spasi tepi diabaikan. */
export function cocokKodeUndangan(masukan: string, kodeBenar: string | undefined): boolean {
  if (!kodeBenar || kodeBenar.length === 0) return false;
  return masukan.trim() === kodeBenar.trim();
}
