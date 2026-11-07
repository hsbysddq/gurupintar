import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IsiMateri, SumberMateri } from '@/lib/tipe';

/**
 * Catat satu pembuatan Ubah Modul. Kegagalan pencatatan tidak boleh menggagalkan
 * generate; riwayat hanyalah pelengkap.
 */
export async function catatRiwayatModul(
  db: SupabaseClient,
  guruId: string,
  isi: IsiMateri,
  sumber: SumberMateri = 'ai',
): Promise<void> {
  const { error } = await db.from('riwayat_modul').insert({
    guru_id: guruId,
    judul: isi.judul,
    format: isi.format_utama ?? 'bacaan',
    gaya_audio: isi.gaya_audio ?? null,
    isi,
    sumber,
  });
  if (error) console.error('Riwayat modul gagal dicatat:', error.message);
}
