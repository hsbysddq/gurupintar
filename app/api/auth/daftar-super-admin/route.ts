import { cocokKodeUndangan } from '@/lib/auth';
import { skemaBodyDaftarSuperAdmin } from '@/lib/skema-api';
import { buatAkun, GalatAuth, masukDenganSandi } from '@/lib/server/auth';
import {
  bacaBodyJson,
  PESAN_ERROR_UMUM,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';

const PESAN_KODE_SALAH = 'Kode undangan super-admin tidak valid.';
const PESAN_PENDAFTARAN_TUTUP = 'Pendaftaran super-admin belum dibuka.';

// POST /api/auth/daftar-super-admin: seperti undangan guru lama, tetapi akun
// super-admin tidak terikat sekolah dan hanya bisa dibuat dengan kode server.
export async function POST(request: Request) {
  const input = skemaBodyDaftarSuperAdmin.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  const kodeBenar = process.env.KODE_UNDANGAN_SUPER_ADMIN;
  if (!kodeBenar) return responsError(PESAN_PENDAFTARAN_TUTUP, 503);
  if (!cocokKodeUndangan(input.data.kodeUndangan, kodeBenar)) {
    return responsError(PESAN_KODE_SALAH, 403);
  }

  try {
    await buatAkun(input.data.nama, input.data.email, input.data.password, 'super_admin', null);
    const profil = await masukDenganSandi(input.data.email, input.data.password);
    return responsOk({ peran: 'super_admin' as const, perluMasuk: !profil }, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Pendaftaran super-admin gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
