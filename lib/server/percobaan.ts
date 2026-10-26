import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** True bila tabel percobaan_kuis belum dibuat (migrasi belum dijalankan). */
export function tabelPercobaanBelumAda(err: unknown): boolean {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '';
  return pesan.includes('percobaan_kuis') && (pesan.includes('does not exist') || pesan.includes('schema cache'));
}

/**
 * Semua percobaan kuis milik satu siswa (satu baris per pengiriman, termasuk kerjakan ulang).
 * Bila migrasi percobaan_kuis belum dijalankan, dipakai hasil_siswa (satu baris per kuis) agar halaman tetap jalan.
 * `siswaId` harus berasal dari sesi login di server.
 */
export async function ambilPercobaanSiswa<T>(
  db: SupabaseClient,
  siswaId: string,
  kolom: string,
  opsi: { idSesi?: string[]; terbaruDulu?: boolean; batas?: number } = {},
): Promise<T[]> {
  const kueri = (tabel: 'percobaan_kuis' | 'hasil_siswa') => {
    let q = db.from(tabel).select(kolom).eq('siswa_id', siswaId);
    if (opsi.idSesi) q = q.in('sesi_id', opsi.idSesi);
    if (opsi.terbaruDulu) q = q.order('dikirim_pada', { ascending: false });
    if (opsi.batas) q = q.limit(opsi.batas);
    return q;
  };
  let hasil = await kueri('percobaan_kuis');
  if (hasil.error && tabelPercobaanBelumAda(hasil.error)) hasil = await kueri('hasil_siswa');
  if (hasil.error) throw hasil.error;
  return hasil.data as unknown as T[];
}
