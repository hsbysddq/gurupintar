import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export const PESAN_NAMA_DIPAKAI =
  'Nama ini sudah dipakai siswa lain di kelas. Gunakan nama pembeda atau hubungi guru.';

export type HasilTambahAnggota =
  | { ok: true }
  | { ok: false; konflikNama: boolean; error: unknown };

function pesanError(err: unknown): string {
  return typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
    ? err.message
    : '';
}

/** True jika kolom nama_tampil belum ada (migrasi identitas belum dijalankan). */
function kolomNamaTampilHilang(err: unknown): boolean {
  const pesan = pesanError(err);
  return pesan.includes('nama_tampil') && (pesan.includes('does not exist') || pesan.includes('schema cache'));
}

/**
 * Menambahkan siswa ke kelas. Jika kolom nama_tampil sudah ada, indeks unik per kelas
 * mencegah dua akun memakai nama yang sama. Sebelum migrasi, insert tetap jalan tanpa kolom itu.
 */
export async function tambahAnggotaKelas(
  db: SupabaseClient,
  kelasId: string,
  siswaId: string,
  namaTampil: string,
): Promise<HasilTambahAnggota> {
  let hasil = await db
    .from('keanggotaan_kelas')
    .insert({ kelas_id: kelasId, siswa_id: siswaId, nama_tampil: namaTampil });

  if (hasil.error && kolomNamaTampilHilang(hasil.error)) {
    hasil = await db.from('keanggotaan_kelas').insert({ kelas_id: kelasId, siswa_id: siswaId });
  }
  if (!hasil.error) return { ok: true };

  const konflikNama = hasil.error.code === '23505' && !pesanError(hasil.error).includes('keanggotaan_kelas_pkey');
  return { ok: false, konflikNama, error: hasil.error };
}
