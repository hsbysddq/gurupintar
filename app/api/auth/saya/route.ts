import { PESAN_MASUK_DIPERLUKAN } from '@/lib/auth';
import { ambilProfil } from '@/lib/server/auth';
import { PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';

// GET /api/auth/saya: profil pengguna yang sedang login, tanpa data rahasia.
export async function GET() {
  try {
    const profil = await ambilProfil();
    if (!profil) return responsError(PESAN_MASUK_DIPERLUKAN, 401);
    return responsOk({ pengguna: profil });
  } catch (err) {
    console.error('Gagal membaca profil:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
