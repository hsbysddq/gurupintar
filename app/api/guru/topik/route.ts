import { skemaBodyHapusTopik, skemaBodyTopikBaru, skemaBodyUbahTopik } from '@/lib/skema-api';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';
import { keBarisSoal, susunDaftarTopik } from '@/lib/soal-guru';
import { wajibPeranApi } from '@/lib/server/auth';
import { topikDipakai, topikMilikGuru } from '@/lib/server/topik';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';
import type { TopikRingkas } from '@/lib/tipe';

const PESAN_TOPIK_TIDAK_VALID = 'Isian topik atau soal belum sesuai. Periksa lagi form.';
const PESAN_TOPIK_TIDAK_ADA = 'Topik tidak ditemukan.';
const PESAN_TOPIK_DIPAKAI = 'Topik ini sudah dipakai kuis dan tidak bisa diubah atau dihapus. Buat topik baru untuk versi berbeda.';
const PESAN_MIGRASI_UBAH = 'Fitur ubah topik belum aktif. Jalankan supabase/migrasi-ubah-topik.sql di Supabase.';

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

// POST /api/guru/topik (PRD F-10): topik lalu soal-soalnya dalam satu insert; jika soal gagal, topik dihapus lagi.
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

    const respons: TopikRingkas = { id: topik.data.id, nama: topik.data.nama, jumlahSoal: soal.length };
    return responsOk(respons, 201);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// PATCH /api/guru/topik: ubah topik + soalnya sekaligus, hanya jika belum dipakai kuis.
export async function PATCH(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyUbahTopik.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_TOPIK_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const topik = await topikMilikGuru(db, auth.profil.id, input.data.id);
    if (!topik) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
    if (await topikDipakai(db, topik.id)) return responsError(PESAN_TOPIK_DIPAKAI, 409);

    const { error } = await db.rpc('ubah_topik', {
      p_topik: topik.id,
      p_nama: input.data.nama,
      p_capaian: input.data.capaianPembelajaran,
      p_soal: keBarisSoal(topik.id, input.data.soal),
    });
    if (error) {
      const pesan = error.message ?? '';
      if (error.code === 'PGRST202' || (pesan.includes('ubah_topik') && pesan.includes('Could not find'))) {
        return responsError(PESAN_MIGRASI_UBAH, 503);
      }
      if (pesan.includes('TOPIK_TIDAK_ADA')) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
      return petakanErrorDb(error);
    }

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// DELETE /api/guru/topik: hapus topik yang belum dipakai kuis.
export async function DELETE(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyHapusTopik.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_TOPIK_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const topik = await topikMilikGuru(db, auth.profil.id, input.data.id);
    if (!topik) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
    if (await topikDipakai(db, topik.id)) return responsError(PESAN_TOPIK_DIPAKAI, 409);

    const { data, error } = await db
      .from('topik')
      .delete()
      .eq('id', topik.id)
      .eq('dibuat_oleh', auth.profil.id)
      .select('id');
    if (error) return petakanErrorDb(error);
    if (data.length === 0) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
