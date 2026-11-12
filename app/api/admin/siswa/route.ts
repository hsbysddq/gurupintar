import { skemaBodyAkunSiswa } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi, wajibSekolah } from '@/lib/server/auth';
import { buatSiswaSekolah, daftarSiswaSekolah } from '@/lib/server/akun';
import { daftarKelasSekolah } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  petakanErrorDb,
  responsError,
  responsOk,
} from '@/lib/server/respons';

export async function GET() {
  const auth = await wajibPeranApi('admin_sekolah');
  if (!auth.ok) return auth.respons;
  try {
    const db = ambilSupabase();
    const sekolahId = wajibSekolah(auth.profil);
    const [siswa, kelas] = await Promise.all([
      daftarSiswaSekolah(db, sekolahId),
      daftarKelasSekolah(db, sekolahId),
    ]);
    return responsOk({ siswa, kelas });
  } catch (err) {
    return petakanErrorDb(err);
  }
}

export async function POST(request: Request) {
  const auth = await wajibPeranApi('admin_sekolah');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyAkunSiswa.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const id = await buatSiswaSekolah(
      db,
      wajibSekolah(auth.profil),
      input.data.nama,
      input.data.email,
      input.data.password,
      input.data.kelasIds ?? [],
    );
    return responsOk({ id }, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Buat akun siswa gagal:', err instanceof Error ? err.message : err);
    return petakanErrorDb(err);
  }
}
