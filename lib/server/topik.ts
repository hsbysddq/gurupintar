import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';

export type TopikMilik = { id: string; nama: string; capaian_pembelajaran: string };

/** Topik yang boleh diubah/dihapus: milik guru sendiri dan bukan topik demo bersama. */
export async function topikMilikGuru(
  db: SupabaseClient,
  guruId: string,
  topikId: string,
): Promise<TopikMilik | null> {
  if (topikId === TOPIK_DEMO_ID) return null;

  const { data, error } = await db
    .from('topik')
    .select('id, nama, capaian_pembelajaran')
    .eq('id', topikId)
    .eq('dibuat_oleh', guruId)
    .maybeSingle();
  if (error) throw error;
  return data as TopikMilik | null;
}

/** Topik yang sudah dipakai sesi kuis tidak boleh diubah/dihapus agar riwayat tetap utuh. */
export async function topikDipakai(db: SupabaseClient, topikId: string): Promise<boolean> {
  const { count, error } = await db
    .from('sesi_kuis')
    .select('*', { count: 'exact', head: true })
    .eq('topik_id', topikId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
