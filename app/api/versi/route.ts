import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

let versiCache: string | null = null;

function versiBuild(): string | null {
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

function maintenanceAktif(): boolean {
  const nilai = (process.env.MAINTENANCE_MODE ?? '').toLowerCase();
  return nilai === '1' || nilai === 'true' || nilai === 'ya';
}

// GET /api/versi: dipakai tab yang sudah terbuka untuk mendeteksi deploy baru.
export async function GET() {
  return Response.json(
    {
      versi: versiBuild(),
      maintenance: maintenanceAktif(),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
