import { skemaBodyBukaBlokir } from '@/lib/skema-api';
import { anggotaKelas, sesiMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { bukaBlokirSiswa } from '@/lib/server/blokir';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';

// POST /api/guru/blokir: guru membuka blokir siswa pada satu kuis. Hanya guru pemilik kelas, dan siswa harus
// anggota kelas itu. Setelah dibuka, hitungan pelanggaran siswa kembali ke 0 dan ia boleh mengerjakan lagi.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyBukaBlokir.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, siswaId } = input.data;

  try {
    const db = ambilSupabase();
    const sesi = await sesiMilikGuru(db, auth.profil.id, sesiId);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);
    if (!(await anggotaKelas(db, siswaId, sesi.kelas_id))) {
      return responsError('Siswa tidak terdaftar di kelas ini.', 404);
    }

    const dibuka = await bukaBlokirSiswa(db, sesiId, siswaId);
    if (!dibuka) return responsError('Siswa ini tidak sedang diblokir.', 409);
    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
