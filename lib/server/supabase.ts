import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let klien: SupabaseClient | null = null;

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

  klien = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return klien;
}
