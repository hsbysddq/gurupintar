import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { tabelPercobaanBelumAda } from './percobaan';

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

/**
 * Mengeluarkan siswa dari kelas beserta jawaban, hasil, dan riwayat percobaan kuisnya di kelas itu.
 * Dikerjakan langsung dengan penghapusan biasa (tanpa fungsi SQL khusus) supaya jalan di database mana pun;
 * keanggotaan dihapus terakhir, jadi bila ada langkah yang gagal siswa tetap terdaftar dan bisa mengulang.
 * Pemanggil wajib sudah memeriksa hak (siswa menghapus dirinya sendiri, atau guru pemilik kelas).
 */
export async function hapusAnggotaKelas(db: SupabaseClient, kelasId: string, siswaId: string): Promise<void> {
  const sesi = await db.from('sesi_kuis').select('id').eq('kelas_id', kelasId);
  if (sesi.error) throw sesi.error;
  const idSesi = sesi.data.map((s) => s.id as string);

  if (idSesi.length > 0) {
    const jawaban = await db.from('jawaban').delete().eq('siswa_id', siswaId).in('sesi_id', idSesi);
    if (jawaban.error) throw jawaban.error;

    const percobaan = await db.from('percobaan_kuis').delete().eq('siswa_id', siswaId).in('sesi_id', idSesi);
    if (percobaan.error && !tabelPercobaanBelumAda(percobaan.error)) throw percobaan.error;

    const hasil = await db.from('hasil_siswa').delete().eq('siswa_id', siswaId).in('sesi_id', idSesi);
    if (hasil.error) throw hasil.error;
  }

  const anggota = await db.from('keanggotaan_kelas').delete().eq('kelas_id', kelasId).eq('siswa_id', siswaId);
  if (anggota.error) throw anggota.error;
}
