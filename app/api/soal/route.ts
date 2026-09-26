import type { NextRequest } from 'next/server';
import { skemaQuerySoal } from '@/lib/skema-api';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { PilihanSoal, SoalUntukSiswa } from '@/lib/tipe';

// GET /api/soal?sesi= (PRD F-3)
// Kolom kunci dan miskonsepsi sengaja tidak di-select agar tidak pernah sampai ke browser (AC-3.5).
export async function GET(request: NextRequest) {
  const input = skemaQuerySoal.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('topik_id')
      .eq('id', input.data.sesi)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const soal = await db
      .from('soal')
      .select('id, nomor, teks, pilihan')
      .eq('topik_id', sesi.topik_id)
      .order('nomor');
    if (soal.error) return petakanErrorDb(soal.error);

    const respons: SoalUntukSiswa[] = soal.data.map((s) => ({
      id: s.id,
      nomor: s.nomor,
      teks: s.teks,
      pilihan: s.pilihan as PilihanSoal[],
    }));
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
