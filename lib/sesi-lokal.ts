// Satu-satunya modul yang boleh memakai localStorage (design.md bagian 5).
// Identitas siswa kini berasal dari sesi login di server; yang disimpan di sini hanya kuis aktif.
import type { Format } from './tipe';

export interface SesiAktif {
  sesiId: string;
  kodeKelas: string;
  format: Format | null;
  /** Kelas tempat kuis ini berada; dipakai tombol kembali ke halaman mata pelajaran. Boleh kosong pada data lama. */
  kelasId?: string;
}

const KUNCI = 'guru-pintar:sesi-aktif';
const PERISTIWA = 'guru-pintar:sesi-aktif-berubah';
const DAFTAR_FORMAT: Format[] = ['ppt', 'audio', 'bacaan', 'latihan'];

function penyimpanan(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Nilai mentah (string) agar bisa dipakai sebagai snapshot useSyncExternalStore. */
export function bacaSesiMentah(): string | null {
  try {
    return penyimpanan()?.getItem(KUNCI) ?? null;
  } catch {
    return null;
  }
}

export function uraiSesi(mentah: string | null): SesiAktif | null {
  if (!mentah) return null;
  try {
    const data: unknown = JSON.parse(mentah);
    if (
      typeof data === 'object' &&
      data !== null &&
      'sesiId' in data &&
      typeof data.sesiId === 'string' &&
      'kodeKelas' in data &&
      typeof data.kodeKelas === 'string'
    ) {
      const format =
        'format' in data && typeof data.format === 'string' && DAFTAR_FORMAT.includes(data.format as Format)
          ? (data.format as Format)
          : null;
      const kelasId = 'kelasId' in data && typeof data.kelasId === 'string' && data.kelasId ? data.kelasId : null;
      return { sesiId: data.sesiId, kodeKelas: data.kodeKelas, format, ...(kelasId ? { kelasId } : {}) };
    }
    return null;
  } catch {
    return null;
  }
}

export function ambilSesi(): SesiAktif | null {
  return uraiSesi(bacaSesiMentah());
}

function tulis(nilai: string | null) {
  try {
    const simpanan = penyimpanan();
    if (!simpanan) return;
    if (nilai === null) simpanan.removeItem(KUNCI);
    else simpanan.setItem(KUNCI, nilai);
    window.dispatchEvent(new Event(PERISTIWA));
  } catch {
    // Penyimpanan diblokir (misalnya mode privat); alur tetap berjalan tanpa sesi tersimpan.
  }
}

export function simpanSesi(sesi: SesiAktif) {
  tulis(JSON.stringify(sesi));
}

export function simpanFormatLokal(format: Format) {
  const sesi = ambilSesi();
  if (sesi) simpanSesi({ ...sesi, format });
}

export function hapusSesi() {
  tulis(null);
}

/** Berlangganan perubahan sesi (tab ini maupun tab lain). */
export function berlanggananSesi(panggil: () => void): () => void {
  window.addEventListener('storage', panggil);
  window.addEventListener(PERISTIWA, panggil);
  return () => {
    window.removeEventListener('storage', panggil);
    window.removeEventListener(PERISTIWA, panggil);
  };
}
