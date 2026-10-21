import type { NextRequest } from 'next/server';
import { skemaQueryMateriSiswa } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, PESAN_INPUT_TIDAK_VALID, PESAN_SESI_TIDAK_ADA, responsError, responsOk } from '@/lib/server/respons';
import type { IsiMateri, MateriSiswa } from '@/lib/tipe';

// GET /api/materi?sesi= (PRD F-7)
// Kelompok hanya dipakai di server untuk memilih materi; tidak pernah ikut dalam respons (D-2, AC-7.7).
// Identitas siswa berasal dari sesi login, bukan query string.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryMateriSiswa.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const sesiId = input.data.sesi;
  const siswaId = auth.profil.id;

  try {
    const db = ambilSupabase();
    const sesi = await db.from('sesi_kuis').select('topik_id, kelas_id').eq('id', sesiId).maybeSingle();
    if (sesi.error) return petakanErrorDb(sesi.error);
    if (!sesi.data) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    if (!(await anggotaKelas(db, siswaId, sesi.data.kelas_id))) {
      return responsError('Kamu tidak terdaftar di kelas kuis ini.', 403);
    }

    // Selalu kelompok terbaru, termasuk jika siswa mengirim ulang (architecture.md 7.4).
    const hasil = await db
      .from('hasil_siswa')
      .select('kelompok')
      .eq('sesi_id', sesiId)
      .eq('siswa_id', siswaId)
      .maybeSingle();
    if (hasil.error) return petakanErrorDb(hasil.error);
    if (!hasil.data) return responsOk<MateriSiswa>({ status: 'belum-mengerjakan' });

    const [materi, topik] = await Promise.all([
      db
        .from('materi')
        .select('isi')
        .eq('sesi_id', sesiId)
        .eq('kelompok', hasil.data.kelompok)
        .eq('status', 'dibagikan')
        .maybeSingle(),
      db.from('topik').select('nama').eq('id', sesi.data.topik_id).single(),
    ]);
    if (materi.error) return petakanErrorDb(materi.error);
    if (topik.error) return petakanErrorDb(topik.error);
    if (!materi.data) return responsOk<MateriSiswa>({ status: 'disiapkan' });

    return responsOk<MateriSiswa>({ status: 'tersedia', namaTopik: topik.data.nama, isi: materi.data.isi as IsiMateri });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
