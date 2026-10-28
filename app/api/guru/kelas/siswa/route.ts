import { skemaBodyHapusSiswa } from '@/lib/skema-api';
import { hapusAnggotaKelas } from '@/lib/server/anggota';
import { kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

const PESAN_KELAS_TIDAK_ADA = 'Kelas tidak ditemukan.';

// DELETE /api/guru/kelas/siswa: keluarkan siswa dari kelas beserta jawaban/hasilnya di kelas itu.
export async function DELETE(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyHapusSiswa.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { kelasId, siswaId } = input.data;

  try {
    const db = ambilSupabase();
    if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
      return responsError(PESAN_KELAS_TIDAK_ADA, 404);
    }

    await hapusAnggotaKelas(db, kelasId, siswaId);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
