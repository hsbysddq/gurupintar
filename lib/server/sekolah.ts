import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sekolah } from '@/lib/tipe';
import { GalatAuth } from './auth';
import { buatAkun } from './auth';

export type BarisSekolah = {
  id: string;
  nama: string;
  alamat: string | null;
  kode: string;
  dibuat_pada: string;
};

function pesanDb(err: unknown): string {
  return typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
    ? err.message
    : '';
}

export async function daftarSekolah(db: SupabaseClient): Promise<Sekolah[]> {
  const { data, error } = await db
    .from('sekolah')
    .select('id, nama, alamat, kode, dibuat_pada')
    .order('nama');
  if (error) throw error;
  return (data as BarisSekolah[]).map(({ dibuat_pada, ...s }) => ({ ...s, dibuatPada: dibuat_pada }));
}

export async function buatSekolah(
  db: SupabaseClient,
  input: { nama: string; alamat?: string; kode: string },
): Promise<Sekolah> {
  const { data, error } = await db
    .from('sekolah')
    .insert({ nama: input.nama, alamat: input.alamat ?? null, kode: input.kode })
    .select('id, nama, alamat, kode, dibuat_pada')
    .single();
  if (error) {
    if (pesanDb(error).includes('duplicate') || pesanDb(error).includes('unique')) {
      throw new GalatAuth('Kode sekolah sudah dipakai.', 409);
    }
    throw error;
  }
  const { dibuat_pada, ...s } = data as BarisSekolah;
  return { ...s, dibuatPada: dibuat_pada };
}

export async function buatAdminSekolah(
  sekolahId: string,
  nama: string,
  email: string,
  password: string,
): Promise<string> {
  return buatAkun(nama, email, password, 'admin_sekolah', sekolahId);
}

export async function sekolahAda(db: SupabaseClient, sekolahId: string): Promise<boolean> {
  const { data, error } = await db.from('sekolah').select('id').eq('id', sekolahId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function kelasMilikSekolah(
  db: SupabaseClient,
  sekolahId: string,
  kelasId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('kelas')
    .select('id')
    .eq('id', kelasId)
    .eq('sekolah_id', sekolahId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function daftarKelasSekolah(
  db: SupabaseClient,
  sekolahId: string,
): Promise<{ id: string; nama: string; mapel: string }[]> {
  const { data, error } = await db
    .from('kelas')
    .select('id, nama, mapel')
    .eq('sekolah_id', sekolahId)
    .is('diarsipkan_pada', null)
    .order('nama');
  if (error) throw error;
  return data as { id: string; nama: string; mapel: string }[];
}
