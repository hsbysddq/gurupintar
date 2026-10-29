import { z } from 'zod';
import { skemaBodyMateriPustaka, skemaBodyUbahMateriPustaka } from '@/lib/skema-api';
import { kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  petakanErrorDb,
  responsError,
  responsOk,
  tabelBelumAda,
} from '@/lib/server/respons';
import { lengkapiIsiMateri } from '@/lib/validasi-materi';
import type { AsalMateriPustaka, MateriPustaka, SumberMateri } from '@/lib/tipe';

const KOLOM = 'id, kelas_id, bab, judul, isi, sumber, asal, dibuat_pada, diperbarui_pada';
const PESAN_KELAS_TIDAK_ADA = 'Kelas tidak ditemukan.';
const PESAN_MATERI_TIDAK_ADA = 'Materi tidak ditemukan.';
const PESAN_MIGRASI =
  'Fitur pustaka materi belum aktif. Jalankan supabase/migrasi-materi-pustaka.sql di Supabase SQL Editor.';

type BarisMateriPustaka = {
  id: string;
  kelas_id: string;
  bab: string;
  judul: string;
  isi: unknown;
  sumber: SumberMateri;
  asal: AsalMateriPustaka;
  dibuat_pada: string;
  diperbarui_pada: string;
};

function keMateri(baris: BarisMateriPustaka): MateriPustaka {
  return {
    id: baris.id,
    kelasId: baris.kelas_id,
    bab: baris.bab,
    judul: baris.judul,
    isi: lengkapiIsiMateri(baris.isi),
    sumber: baris.sumber,
    asal: baris.asal,
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

function galatDb(err: unknown): Response {
  if (tabelBelumAda(err)) return responsError(PESAN_MIGRASI, 503);
  console.error('Pustaka materi:', err);
  return petakanErrorDb(err);
}

// GET /api/guru/materi-pustaka?kelas= (daftar) atau ?id= (satu materi).
export async function GET(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const kelas = url.searchParams.get('kelas');

  try {
    const db = ambilSupabase();

    if (id) {
      if (!z.uuid().safeParse(id).success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
      const { data, error } = await db
        .from('materi_pustaka')
        .select(KOLOM)
        .eq('id', id)
        .eq('guru_id', auth.profil.id)
        .maybeSingle();
      if (error) return galatDb(error);
      if (!data) return responsError(PESAN_MATERI_TIDAK_ADA, 404);
      return responsOk(keMateri(data as BarisMateriPustaka));
    }

    if (!kelas || !z.uuid().safeParse(kelas).success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
    if (!(await kelasMilikGuru(db, auth.profil.id, kelas))) return responsError(PESAN_KELAS_TIDAK_ADA, 404);

    const { data, error } = await db
      .from('materi_pustaka')
      .select(KOLOM)
      .eq('kelas_id', kelas)
      .eq('guru_id', auth.profil.id)
      .order('bab')
      .order('diperbarui_pada', { ascending: false });
    if (error) return galatDb(error);
    return responsOk((data as BarisMateriPustaka[]).map(keMateri));
  } catch (err) {
    return galatDb(err);
  }
}

// POST /api/guru/materi-pustaka: simpan satu materi mandiri ke kelas.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyMateriPustaka.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    if (!(await kelasMilikGuru(db, auth.profil.id, input.data.kelasId))) {
      return responsError(PESAN_KELAS_TIDAK_ADA, 404);
    }

    const { data, error } = await db
      .from('materi_pustaka')
      .insert({
        guru_id: auth.profil.id,
        kelas_id: input.data.kelasId,
        bab: input.data.bab,
        judul: input.data.judul,
        isi: input.data.isi,
        sumber: input.data.sumber,
        asal: input.data.asal,
      })
      .select(KOLOM)
      .single();
    if (error) return galatDb(error);
    return responsOk(keMateri(data as BarisMateriPustaka), 201);
  } catch (err) {
    return galatDb(err);
  }
}

// PATCH /api/guru/materi-pustaka: ubah bab/judul/isi materi yang sudah tersimpan.
export async function PATCH(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyUbahMateriPustaka.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data, error } = await db
      .from('materi_pustaka')
      .update({
        bab: input.data.bab,
        judul: input.data.judul,
        isi: input.data.isi,
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', input.data.id)
      .eq('guru_id', auth.profil.id)
      .select(KOLOM)
      .maybeSingle();
    if (error) return galatDb(error);
    if (!data) return responsError(PESAN_MATERI_TIDAK_ADA, 404);
    return responsOk(keMateri(data as BarisMateriPustaka));
  } catch (err) {
    return galatDb(err);
  }
}

// DELETE /api/guru/materi-pustaka?id=
export async function DELETE(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const id = new URL(request.url).searchParams.get('id');
  if (!id || !z.uuid().safeParse(id).success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data, error } = await db
      .from('materi_pustaka')
      .delete()
      .eq('id', id)
      .eq('guru_id', auth.profil.id)
      .select('id')
      .maybeSingle();
    if (error) return galatDb(error);
    if (!data) return responsError(PESAN_MATERI_TIDAK_ADA, 404);
    return responsOk({ ok: true });
  } catch (err) {
    return galatDb(err);
  }
}
