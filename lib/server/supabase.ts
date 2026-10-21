import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let klien: SupabaseClient | null = null;

/** URL harus base URL proyek, bukan endpoint REST (`/rest/v1`). */
export function periksaUrlSupabase(url: string): void {
  let alamat: URL;
  try {
    alamat = new URL(url);
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL bukan URL yang valid. Contoh: https://xxxx.supabase.co',
    );
  }
  if (alamat.pathname !== '/' && alamat.pathname !== '') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL harus base URL proyek tanpa path. Hapus bagian seperti /rest/v1 dari nilainya.',
    );
  }
}

/**
 * Menolak kunci anon/publishable yang tidak sengaja dipakai sebagai service role.
 * Tanpa pemeriksaan ini, RLS akan membuat semua query mengembalikan 0 baris tanpa error.
 */
export function periksaKunciService(kunci: string): void {
  if (kunci.startsWith('sb_secret_')) return;
  if (kunci.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY berisi publishable/anon key. Ganti dengan service_role key atau secret key dari Supabase.',
    );
  }

  const bagian = kunci.split('.');
  if (bagian.length !== 3) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak dikenali. Gunakan service_role key dari Supabase.');
  }

  let peran: unknown;
  try {
    const muatan = JSON.parse(Buffer.from(bagian[1], 'base64url').toString('utf8')) as { role?: unknown };
    peran = muatan.role;
  } catch {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak bisa dibaca. Gunakan service_role key dari Supabase.');
  }

  if (peran !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY berisi kunci dengan role "${String(peran)}". Ganti dengan service_role key atau secret key dari Supabase.`,
    );
  }
}

/**
 * Klien Supabase dengan service role key. Satu-satunya pintu akses database (AD-2).
 * Dibuat saat pertama dipanggil agar build tidak gagal ketika env belum diisi.
 */
export function ambilSupabase(): SupabaseClient {
  if (klien) return klien;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local');
  }
  periksaUrlSupabase(url);
  periksaKunciService(kunci);

  klien = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return klien;
}
