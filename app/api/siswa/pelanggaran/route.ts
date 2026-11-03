import { skemaBodyPelanggaran } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { catatPelanggaranSiswa } from '@/lib/server/blokir';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_DITUTUP,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { HasilPelanggaran } from '@/lib/tipe';

// POST /api/siswa/pelanggaran: browser melaporkan siswa meninggalkan halaman kuis (pindah tab, buka aplikasi lain).
// `siswaId` dari sesi login. Pada pelanggaran ketiga siswa diblokir di server sampai guru membukanya.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyPelanggaran.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId } = input.data;

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db.from('sesi_kuis').select('kelas_id, status').eq('id', sesiId).maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);
    if (sesi.status !== 'aktif') return responsError(PESAN_SESI_DITUTUP, 409);
    if (!(await anggotaKelas(db, auth.profil.id, sesi.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    const { keadaan } = await catatPelanggaranSiswa(db, sesiId, auth.profil.id);
    return responsOk<HasilPelanggaran>({ jumlah: keadaan.jumlah, terblokir: keadaan.terblokir });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
