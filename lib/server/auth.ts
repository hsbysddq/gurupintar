import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { peranDariMetadata, PESAN_AKSES_DITOLAK, PESAN_MASUK_DIPERLUKAN, tujuanSetelahMasuk } from '@/lib/auth';
import type { Peran, Profil } from '@/lib/tipe';
import { responsError } from './respons';
import { ambilSupabase, periksaUrlSupabase } from './supabase';

export class GalatAuth extends Error {
  readonly status: number;

  constructor(pesan: string, status = 400) {
    super(pesan);
    this.name = 'GalatAuth';
    this.status = status;
  }
}

/** True jika database belum menjalankan migrasi kolom arsip kelas. */
export function kolomArsipBelumAda(err: unknown): boolean {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '';
  return pesan.includes('diarsipkan_pada') && (pesan.includes('does not exist') || pesan.includes('schema cache'));
}

function envAuth(): { url: string; kunci: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi di .env.local');
  }
  periksaUrlSupabase(url);
  if (kunci.startsWith('sb_secret_')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY tidak boleh berisi secret key. Gunakan anon/publishable key.');
  }
  return { url, kunci };
}

/**
 * Klien Supabase yang membaca dan menulis cookie sesi. Dipakai route handler dan server component.
 * `getUser()` selalu memverifikasi token ke server Auth, tidak seperti `getSession()`.
 */
export async function buatKlienAuth(): Promise<SupabaseClient> {
  const { url, kunci } = envAuth();
  const penyimpanan = await cookies();

  return createServerClient(url, kunci, {
    cookies: {
      getAll: () => penyimpanan.getAll(),
      setAll: (daftar) => {
        try {
          for (const { name, value, options } of daftar) penyimpanan.set(name, value, options);
        } catch {
          // Server Component tidak boleh menulis cookie; proxy yang menyegarkan sesi.
        }
      },
    },
  });
}

async function profilDariUser(user: User): Promise<Profil | null> {
  const peranMeta = peranDariMetadata(user.app_metadata);
  if (!peranMeta) return null;

  const { data, error } = await ambilSupabase()
    .from('pengguna')
    .select('id, nama, peran')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.peran !== peranMeta) return null;

  return {
    id: data.id,
    nama: data.nama,
    email: user.email ?? '',
    peran: peranMeta,
  };
}

/** Profil pengguna yang sedang login, atau `null`. */
export async function ambilProfil(): Promise<Profil | null> {
  const supabase = await buatKlienAuth();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return profilDariUser(data.user);
}

/** Untuk layout/server component: redirect ke login atau ke area yang sesuai peran. */
export async function profilWajib(peran: Peran): Promise<Profil> {
  const profil = await ambilProfil();
  if (!profil) redirect('/masuk');
  if (profil.peran !== peran) redirect(tujuanSetelahMasuk(profil.peran));
  return profil;
}

export type HasilWajib = { ok: true; profil: Profil } | { ok: false; respons: Response };

/** Untuk API route: 401 jika belum login, 403 jika peran tidak cocok. */
export async function wajibPeranApi(peran: Peran): Promise<HasilWajib> {
  const profil = await ambilProfil();
  if (!profil) return { ok: false, respons: responsError(PESAN_MASUK_DIPERLUKAN, 401) };
  if (profil.peran !== peran) return { ok: false, respons: responsError(PESAN_AKSES_DITOLAK, 403) };
  return { ok: true, profil };
}

/** Login email+sandi. Cookie sesi ditulis oleh adapter `setAll`. */
export async function masukDenganSandi(email: string, password: string): Promise<Profil | null> {
  const supabase = await buatKlienAuth();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  const profil = await profilDariUser(data.user);
  if (!profil) {
    throw new GalatAuth('Akun ini belum terdaftar sebagai guru atau siswa. Hubungi pengelola sekolah.', 403);
  }
  return profil;
}

export async function keluarDariAkun(): Promise<void> {
  const supabase = await buatKlienAuth();
  await supabase.auth.signOut();
}

/**
 * Membuat akun Auth dengan peran di `app_metadata` (hanya bisa ditulis service role),
 * lalu baris `pengguna`. Jika profil gagal dibuat, akun Auth dihapus lagi.
 */
export async function buatAkun(nama: string, email: string, password: string, peran: Peran): Promise<string> {
  const admin = ambilSupabase();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { peran },
    user_metadata: { nama },
  });
  if (error || !data.user) {
    const pesan = error?.message.toLowerCase() ?? '';
    if (pesan.includes('already') || pesan.includes('registered') || pesan.includes('exists')) {
      throw new GalatAuth('Email ini sudah terdaftar. Masuk atau pakai email lain.', 409);
    }
    if (pesan.includes('password')) {
      throw new GalatAuth('Kata sandi belum memenuhi syarat. Gunakan minimal 8 karakter.', 400);
    }
    throw new GalatAuth('Akun belum berhasil dibuat. Coba lagi sebentar.', 500);
  }

  const { error: galatProfil } = await admin.from('pengguna').insert({ id: data.user.id, nama, email, peran });
  if (galatProfil) {
    const pesan = galatProfil.message ?? '';
    const kolomEmailHilang = pesan.includes('email') && (pesan.includes('does not exist') || pesan.includes('schema cache'));
    if (kolomEmailHilang) {
      const { error: galatCadangan } = await admin.from('pengguna').insert({ id: data.user.id, nama, peran });
      if (!galatCadangan) return data.user.id;
    }
    await admin.auth.admin.deleteUser(data.user.id);
    throw new GalatAuth('Akun belum berhasil dibuat. Coba lagi sebentar.', 500);
  }

  return data.user.id;
}

/** ID kelas aktif milik guru (kelas diarsipkan tidak ikut). */
export async function idKelasMilikGuru(db: SupabaseClient, guruId: string): Promise<string[]> {
  const dasar = () => db.from('kelas').select('id').eq('guru_id', guruId);
  let hasil = await dasar().is('diarsipkan_pada', null);
  if (hasil.error && kolomArsipBelumAda(hasil.error)) hasil = await dasar();
  if (hasil.error) throw hasil.error;
  return hasil.data.map((k) => k.id as string);
}

export async function kelasMilikGuru(
  db: SupabaseClient,
  guruId: string,
  kelasId: string,
  opsi: { termasukArsip?: boolean } = {},
): Promise<boolean> {
  const dasar = () => db.from('kelas').select('id').eq('id', kelasId).eq('guru_id', guruId);
  let hasil = await (opsi.termasukArsip ? dasar() : dasar().is('diarsipkan_pada', null)).maybeSingle();
  if (hasil.error && !opsi.termasukArsip && kolomArsipBelumAda(hasil.error)) {
    hasil = await dasar().maybeSingle();
  }
  if (hasil.error) throw hasil.error;
  return hasil.data !== null;
}

export type SesiMilikGuru = { id: string; kelas_id: string; topik_id: string };

export async function sesiMilikGuru(
  db: SupabaseClient,
  guruId: string,
  sesiId: string,
): Promise<SesiMilikGuru | null> {
  const { data: sesi, error } = await db
    .from('sesi_kuis')
    .select('id, kelas_id, topik_id')
    .eq('id', sesiId)
    .maybeSingle();
  if (error) throw error;
  if (!sesi) return null;

  const { data: kelas, error: galatKelas } = await db
    .from('kelas')
    .select('id')
    .eq('id', sesi.kelas_id)
    .eq('guru_id', guruId)
    .maybeSingle();
  if (galatKelas) throw galatKelas;
  if (!kelas) return null;

  return { id: sesi.id, kelas_id: sesi.kelas_id, topik_id: sesi.topik_id };
}

export async function materiMilikGuru(db: SupabaseClient, guruId: string, materiId: string): Promise<string | null> {
  const { data: materi, error } = await db.from('materi').select('sesi_id').eq('id', materiId).maybeSingle();
  if (error) throw error;
  if (!materi) return null;

  const sesi = await sesiMilikGuru(db, guruId, materi.sesi_id as string);
  return sesi ? (materi.sesi_id as string) : null;
}

export async function anggotaKelas(db: SupabaseClient, siswaId: string, kelasId: string): Promise<boolean> {
  const { data, error } = await db
    .from('keanggotaan_kelas')
    .select('siswa_id')
    .eq('kelas_id', kelasId)
    .eq('siswa_id', siswaId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Kode undangan kelas atau kode sesi kuis → id kelas. */
export async function kelasDariKode(db: SupabaseClient, kode: string): Promise<string | null> {
  const kelas = await db.from('kelas').select('id').eq('kode_undangan', kode).maybeSingle();
  if (kelas.error) throw kelas.error;
  if (kelas.data) return kelas.data.id as string;

  const sesi = await db.from('sesi_kuis').select('kelas_id').eq('kode_kelas', kode).maybeSingle();
  if (sesi.error) throw sesi.error;
  return sesi.data ? (sesi.data.kelas_id as string) : null;
}
