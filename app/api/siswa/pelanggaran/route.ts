import { skemaBodyPelanggaran } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_DITUTUP,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
  tabelBelumAda,
} from '@/lib/server/respons';

// POST /api/siswa/pelanggaran: catat kejadian mencurigakan selama kuis.
// `siswaId` diambil dari sesi login. Deteksi di browser bersifat heuristik, bukan bukti mutlak.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyPelanggaran.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, jenis } = input.data;

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('kelas_id, status')
      .eq('id', sesiId)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);
    if (sesi.status !== 'aktif') return responsError(PESAN_SESI_DITUTUP, 409);

    if (!(await anggotaKelas(db, auth.profil.id, sesi.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    const simpan = await db.from('pelanggaran_kuis').insert({
      sesi_id: sesiId,
      siswa_id: auth.profil.id,
      jenis,
    });
    if (simpan.error) {
      if (tabelBelumAda(simpan.error)) {
        return responsError('Fitur deteksi kecurangan belum aktif. Jalankan migrasi pelanggaran kuis.', 503);
      }
      return petakanErrorDb(simpan.error);
    }

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
