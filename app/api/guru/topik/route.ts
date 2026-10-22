import { skemaBodyTopikBaru } from '@/lib/skema-api';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';
import { keBarisSoal, susunDaftarTopik } from '@/lib/soal-guru';
import { wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';
import type { TopikRingkas } from '@/lib/tipe';

const PESAN_TOPIK_TIDAK_VALID = 'Isian topik atau soal belum sesuai. Periksa lagi form.';

// GET /api/guru/topik (PRD F-10): topik yang bisa dipakai kuis, tanpa isi soal.
export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  try {
    // Bank soal guru: topik miliknya sendiri + topik demo bersama.
    const { data, error } = await ambilSupabase()
      .from('topik')
      .select('id, nama, soal(count)')
      .or(`dibuat_oleh.eq.${auth.profil.id},id.eq.${TOPIK_DEMO_ID}`);
    if (error) return petakanErrorDb(error);

    const respons: TopikRingkas[] = susunDaftarTopik(
      data.map((t) => ({ id: t.id, nama: t.nama, jumlahSoal: (t.soal as { count: number }[])[0]?.count ?? 0 })),
    );
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// POST /api/guru/topik (PRD F-10): topik lalu 5 soal dalam satu insert; jika soal gagal, topik dihapus lagi.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyTopikBaru.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_TOPIK_TIDAK_VALID, 400);
  const { nama, capaianPembelajaran, soal } = input.data;

  try {
    const db = ambilSupabase();
    const topik = await db
      .from('topik')
      .insert({ nama, capaian_pembelajaran: capaianPembelajaran, dibuat_oleh: auth.profil.id })
      .select('id, nama')
      .single();
    if (topik.error) return petakanErrorDb(topik.error);

    const { error } = await db.from('soal').insert(keBarisSoal(topik.data.id, soal));
    if (error) {
      console.error('Soal gagal disimpan:', error.message);
      // Jika penghapusan ini juga gagal, topik tanpa soal tidak muncul di GET dan ditolak saat membuka kuis.
      const hapus = await db.from('topik').delete().eq('id', topik.data.id);
      if (hapus.error) console.error('Topik tanpa soal gagal dihapus:', hapus.error.message);
      return responsError(PESAN_ERROR_UMUM, 500);
    }

    const respons: TopikRingkas = { id: topik.data.id, nama: topik.data.nama };
    return responsOk(respons, 201);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
