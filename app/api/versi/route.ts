import { maintenanceAktif, versiBuild } from '@/lib/server/versi';

export const dynamic = 'force-dynamic';

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
