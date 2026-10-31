import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

let versiCache: string | null = null;

function versiBuild(): string {
  if (process.env.NODE_ENV !== 'production') return 'dev';
  if (versiCache) return versiCache;
  try {
    versiCache = readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
  } catch {
    versiCache = process.env.NEXT_PUBLIC_VERSI_APLIKASI ?? 'dev';
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
