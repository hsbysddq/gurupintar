import type { NextRequest } from 'next/server';
import { skemaQueryDetailTopik } from '@/lib/skema-api';
import { wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { topikDipakai, topikMilikGuru } from '@/lib/server/topik';
import { petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { KodePilihan, PilihanSoal, SoalTopikDetail, TopikDetail } from '@/lib/tipe';

const PESAN_TOPIK_TIDAK_ADA = 'Topik tidak ditemukan.';

type BarisSoal = {
  nomor: number;
  teks: string;
  pilihan: unknown;
  kunci: string;
  miskonsepsi: unknown;
};

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
    const topik = await topikMilikGuru(db, auth.profil.id, input.data.topik);
    if (!topik) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);

    const soal = await db
      .from('soal')
      .select('nomor, teks, pilihan, kunci, miskonsepsi')
      .eq('topik_id', topik.id)
      .order('nomor');
    if (soal.error) return petakanErrorDb(soal.error);

    const dipakai = await topikDipakai(db, topik.id);

    const respons: TopikDetail = {
      id: topik.id,
      nama: topik.nama,
      capaianPembelajaran: topik.capaian_pembelajaran,
      dipakai,
      soal: (soal.data as BarisSoal[]).map((s) => ({
        nomor: s.nomor,
        teks: s.teks,
        pilihan: s.pilihan as PilihanSoal[],
        kunci: s.kunci as KodePilihan,
        miskonsepsi: (s.miskonsepsi ?? {}) as Partial<Record<KodePilihan, string>>,
      })) as SoalTopikDetail[],
    };

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
