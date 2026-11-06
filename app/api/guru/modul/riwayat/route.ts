import { z } from 'zod';
import { wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
  tabelBelumAda,
} from '@/lib/server/respons';
import { lengkapiIsiMateri } from '@/lib/validasi-materi';
import type { FormatMateri, RiwayatModulDetail, RiwayatModulRingkas } from '@/lib/tipe';

const KOLOM = 'id, judul, format, gaya_audio, gaya_ppt, dibuat_pada';
const BATAS_RIWAYAT = 20;
const PESAN_RIWAYAT_BELUM_SIAP = 'Riwayat Ubah Modul belum siap. Coba lagi beberapa saat.';
const PESAN_RIWAYAT_TIDAK_ADA = 'Riwayat tidak ditemukan.';

type BarisRingkas = {
  id: string;
  judul: string;
  format: FormatMateri;
  gaya_audio: string | null;
  gaya_ppt: string | null;
  dibuat_pada: string;
};

type BarisDetail = BarisRingkas & { isi: unknown };

function keRingkas(baris: BarisRingkas): RiwayatModulRingkas {
  return {
    id: baris.id,
    judul: baris.judul,
    format: baris.format,
    gayaAudio: baris.gaya_audio as RiwayatModulRingkas['gayaAudio'],
    gayaPpt: baris.gaya_ppt as RiwayatModulRingkas['gayaPpt'],
    dibuatPada: baris.dibuat_pada,
  };
}

function galatRiwayat(err: unknown): Response {
  if (tabelBelumAda(err)) return responsError(PESAN_RIWAYAT_BELUM_SIAP, 503);
  console.error('Riwayat modul:', err);
  return petakanErrorDb(err);
}

// GET /api/guru/modul/riwayat (daftar) atau ?id= (detail).
export async function GET(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    const db = ambilSupabase();

    if (id) {
      if (!z.uuid().safeParse(id).success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
      const { data, error } = await db
        .from('riwayat_modul')
        .select(`${KOLOM}, isi`)
        .eq('id', id)
        .eq('guru_id', auth.profil.id)
        .maybeSingle();
      if (error) return galatRiwayat(error);
      if (!data) return responsError(PESAN_RIWAYAT_TIDAK_ADA, 404);

      const baris = data as BarisDetail;
      return responsOk<RiwayatModulDetail>({
        ...keRingkas(baris),
        isi: lengkapiIsiMateri(baris.isi),
      });
    }

    const { data, error } = await db
      .from('riwayat_modul')
      .select(KOLOM)
      .eq('guru_id', auth.profil.id)
      .order('dibuat_pada', { ascending: false })
      .limit(BATAS_RIWAYAT);
    if (error) return galatRiwayat(error);
    return responsOk<RiwayatModulRingkas[]>((data as BarisRingkas[]).map(keRingkas));
  } catch (err) {
    return galatRiwayat(err);
  }
}

// DELETE /api/guru/modul/riwayat?id=
export async function DELETE(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const id = new URL(request.url).searchParams.get('id');
  if (!id || !z.uuid().safeParse(id).success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data, error } = await db
      .from('riwayat_modul')
      .delete()
      .eq('id', id)
      .eq('guru_id', auth.profil.id)
      .select('id')
      .maybeSingle();
    if (error) return galatRiwayat(error);
    if (!data) return responsError(PESAN_RIWAYAT_TIDAK_ADA, 404);
    return responsOk({ ok: true });
  } catch (err) {
    return galatRiwayat(err);
  }
}
