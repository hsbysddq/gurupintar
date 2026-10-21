import { keluarDariAkun } from '@/lib/server/auth';
import { PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';

// POST /api/auth/keluar: hapus cookie sesi di server.
export async function POST() {
  try {
    await keluarDariAkun();
    return responsOk({ ok: true });
  } catch (err) {
    console.error('Logout gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
