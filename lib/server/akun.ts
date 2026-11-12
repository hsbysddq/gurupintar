import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { tambahAnggotaKelas } from './anggota';
import { buatAkun, GalatAuth } from './auth';
import { kelasMilikSekolah } from './sekolah';

export type PenggunaSekolah = {
  id: string;
  nama: string;
  email: string | null;
  peran: 'guru' | 'siswa';
  kelas?: string[];
};

export async function buatGuruSekolah(
  sekolahId: string,
  nama: string,
  email: string,
  password: string,
): Promise<string> {
  return buatAkun(nama, email, password, 'guru', sekolahId);
}

export async function buatSiswaSekolah(
  db: SupabaseClient,
  sekolahId: string,
  nama: string,
  email: string,
  password: string,
  kelasIds: string[] = [],
): Promise<string> {
  for (const kelasId of kelasIds) {
    if (!(await kelasMilikSekolah(db, sekolahId, kelasId))) {
      throw new GalatAuth('Kelas tidak ditemukan di sekolah ini.', 404);
    }
  }

  const siswaId = await buatAkun(nama, email, password, 'siswa', sekolahId);
  for (const kelasId of kelasIds) {
    const tambah = await tambahAnggotaKelas(db, kelasId, siswaId, nama);
    if (!tambah.ok) {
      await db.auth.admin.deleteUser(siswaId);
      if (tambah.konflikNama) throw new GalatAuth('Nama sudah dipakai siswa lain di kelas itu.', 409);
      throw tambah.error;
    }
  }
  return siswaId;
}

export async function daftarGuruSekolah(
  db: SupabaseClient,
  sekolahId: string,
): Promise<PenggunaSekolah[]> {
  const { data, error } = await db
    .from('pengguna')
    .select('id, nama, email, peran')
    .eq('sekolah_id', sekolahId)
    .eq('peran', 'guru')
    .order('nama');
  if (error) throw error;
  return data as PenggunaSekolah[];
}

export async function daftarSiswaSekolah(
  db: SupabaseClient,
  sekolahId: string,
): Promise<PenggunaSekolah[]> {
  const { data, error } = await db
    .from('pengguna')
    .select('id, nama, email, peran')
    .eq('sekolah_id', sekolahId)
    .eq('peran', 'siswa')
    .order('nama');
  if (error) throw error;
  const siswa = data as PenggunaSekolah[];

  if (siswa.length === 0) return [];
  const { data: anggota, error: galatAnggota } = await db
    .from('keanggotaan_kelas')
    .select('siswa_id, kelas(nama)')
    .in('siswa_id', siswa.map((s) => s.id));
  if (galatAnggota) throw galatAnggota;

  const peta = new Map<string, string[]>();
  for (const baris of anggota as { siswa_id: string; kelas: { nama: string } | { nama: string }[] | null }[]) {
    const kelas = Array.isArray(baris.kelas) ? baris.kelas[0] : baris.kelas;
    if (!kelas) continue;
    peta.set(baris.siswa_id, [...(peta.get(baris.siswa_id) ?? []), kelas.nama]);
  }

  return siswa.map((s) => ({ ...s, kelas: peta.get(s.id) ?? [] }));
}
