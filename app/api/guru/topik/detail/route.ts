import type { NextRequest } from 'next/server';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';
import { skemaQueryDetailTopik } from '@/lib/skema-api';
import { wajibPeranApi } from '@/lib/server/auth';
import { bacaSoalTopik } from '@/lib/server/soal-tka-db';
import { ambilSupabase } from '@/lib/server/supabase';
import { topikDipakai, topikMilikGuru } from '@/lib/server/topik';
import { petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { TopikDetail } from '@/lib/tipe';

const PESAN_TOPIK_TIDAK_ADA = 'Topik tidak ditemukan.';

// GET /api/guru/topik/detail?topik=: topik + soal-soalnya untuk form edit.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryDetailTopik.safeParse({
    topik: request.nextUrl.searchParams.get('topik') ?? '',
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    let topik = await topikMilikGuru(db, auth.profil.id, input.data.topik);
    if (!topik && input.data.topik === TOPIK_DEMO_ID) {
      const demo = await db
        .from('topik')
        .select('id, nama, capaian_pembelajaran')
        .eq('id', TOPIK_DEMO_ID)
        .maybeSingle();
      if (demo.error) return petakanErrorDb(demo.error);
      topik = demo.data as { id: string; nama: string; capaian_pembelajaran: string } | null;
    }
    if (!topik) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);

    const soal = await bacaSoalTopik(db, topik.id, { sertakanRahasia: true });
    if (soal.error || !soal.data) return petakanErrorDb(soal.error);

    const dipakai = await topikDipakai(db, topik.id);

    const respons: TopikDetail = {
      id: topik.id,
      nama: topik.nama,
      capaianPembelajaran: topik.capaian_pembelajaran,
      dipakai,
      soal: soal.data.map((s) => ({
        id: s.id,
        nomor: s.nomor,
        tipe: s.tipe,
        teks: s.teks,
        gambar: s.gambar,
        pilihan: s.pilihan,
        kunci: s.kunci,
        miskonsepsi: s.miskonsepsi,
      })),
    };

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
