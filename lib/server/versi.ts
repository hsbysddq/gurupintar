import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let versiCache: string | null = null;

/** Build ID yang sedang dijalankan server. `null` saat build belum selesai/tidak tersedia. */
export function versiBuild(): string | null {
  if (process.env.NODE_ENV !== 'production') return 'dev';
  if (versiCache) return versiCache;
  try {
    // Saat build sedang berjalan, BUILD_ID bisa sementara tidak ada.
    // Kembalikan null agar klien tidak menganggapnya sebagai versi baru.
    const isi = readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
    versiCache = isi || null;
  } catch {
    return null;
  }
  return versiCache;
}

export function maintenanceAktif(): boolean {
  const nilai = (process.env.MAINTENANCE_MODE ?? '').trim().toLowerCase();
  return nilai === '1' || nilai === 'true' || nilai === 'ya';
}
