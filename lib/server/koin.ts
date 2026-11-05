import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export const PESAN_KOIN_HABIS =
  'Koin kamu habis. Top up lewat WhatsApp admin untuk melanjutkan membuat materi.';
export const PESAN_MIGRASI_KOIN =
  'Layanan koin belum siap. Hubungi admin untuk mengaktifkannya.';

export type HasilPotongKoin =
  | { ok: true; sisa: number }
  | { ok: false; alasan: 'kurang' | 'migrasi' | 'gagal'; error?: unknown };

function pesanError(err: unknown): string {
  return typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
    ? err.message
    : '';
}

export function perluMigrasiKoin(err: unknown): boolean {
  const pesan = pesanError(err);
  return (
    (pesan.includes('koin') ||
      pesan.includes('potong_koin') ||
      pesan.includes('tambah_koin') ||
      pesan.includes('transaksi_koin')) &&
    (pesan.includes('does not exist') || pesan.includes('schema cache') || pesan.includes('Could not find'))
  );
}

/** Saldo koin guru. `null` berarti kolom/fungsi koin belum dimigrasikan. */
export async function bacaKoinGuru(db: SupabaseClient, guruId: string): Promise<number | null> {
  const { data, error } = await db.from('pengguna').select('koin').eq('id', guruId).maybeSingle();
  if (error) {
    if (perluMigrasiKoin(error)) return null;
    throw error;
  }
  return data ? Number(data.koin) : null;
}

/** Potong koin secara atomik. Gagal jika saldo kurang atau migrasi belum dijalankan. */
export async function potongKoin(
  db: SupabaseClient,
  guruId: string,
  jumlah: number,
  keterangan: string,
): Promise<HasilPotongKoin> {
  const { data, error } = await db.rpc('potong_koin', {
    p_guru: guruId,
    p_jumlah: jumlah,
    p_keterangan: keterangan,
  });
  if (!error) return { ok: true, sisa: Number(data) };

  const pesan = pesanError(error);
  if (pesan.includes('KOIN_TIDAK_CUKUP')) return { ok: false, alasan: 'kurang', error };
  if (perluMigrasiKoin(error)) return { ok: false, alasan: 'migrasi', error };
  return { ok: false, alasan: 'gagal', error };
}

/** Tambah koin untuk refund atau top up manual. */
export async function tambahKoin(
  db: SupabaseClient,
  guruId: string,
  jumlah: number,
  jenis: 'topup' | 'refund' | 'penyesuaian' | 'bonus_awal',
  keterangan: string,
): Promise<HasilPotongKoin> {
  const { data, error } = await db.rpc('tambah_koin', {
    p_guru: guruId,
    p_jumlah: jumlah,
    p_jenis: jenis,
    p_keterangan: keterangan,
  });
  if (!error) return { ok: true, sisa: Number(data) };
  if (perluMigrasiKoin(error)) return { ok: false, alasan: 'migrasi', error };
  return { ok: false, alasan: 'gagal', error };
}
