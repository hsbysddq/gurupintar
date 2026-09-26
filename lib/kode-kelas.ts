import { KARAKTER_KODE, PANJANG_KODE } from './konstanta';

/** architecture.md 7.4: kode bentrok dicoba ulang dengan kode baru, maksimal 5 kali. */
export const MAKS_PERCOBAAN_KODE = 5;

/** Kode kelas acak yang mudah dibaca (AC-4.2). `acak` bisa diganti agar deterministik saat diuji. */
export function buatKodeKelas(acak: () => number = Math.random): string {
  let kode = '';
  for (let i = 0; i < PANJANG_KODE; i++) {
    const indeks = Math.min(Math.floor(acak() * KARAKTER_KODE.length), KARAKTER_KODE.length - 1);
    kode += KARAKTER_KODE[indeks];
  }
  return kode;
}

/** `true` jika error adalah pelanggaran `unique` Postgres (kode 23505), yaitu kode kelas sudah dipakai. */
export function adalahBentrokKode(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === '23505';
}

export type HasilPercobaan<T> =
  | { status: 'berhasil'; nilai: T }
  | { status: 'bentrok' }
  | { status: 'gagal'; error: unknown };

export type HasilCobaKode<T> =
  | { status: 'berhasil'; nilai: T; kode: string }
  | { status: 'habis' }
  | { status: 'gagal'; error: unknown };

/**
 * Menjalankan `percobaan` dengan kode baru setiap kali hasilnya `bentrok`, paling banyak `maks` kali.
 * Error lain langsung dikembalikan tanpa mencoba ulang.
 */
export async function cobaDenganKodeBaru<T>(
  percobaan: (kode: string) => Promise<HasilPercobaan<T>>,
  buatKode: () => string = () => buatKodeKelas(),
  maks: number = MAKS_PERCOBAAN_KODE,
): Promise<HasilCobaKode<T>> {
  for (let i = 0; i < maks; i++) {
    const kode = buatKode();
    const hasil = await percobaan(kode);
    if (hasil.status === 'berhasil') return { status: 'berhasil', nilai: hasil.nilai, kode };
    if (hasil.status === 'gagal') return hasil;
  }
  return { status: 'habis' };
}
