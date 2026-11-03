import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BLOKIR_KOSONG, bukaBlokirServer, tambahPelanggaranServer, type KeadaanBlokir } from '@/lib/deteksi-curang';

/** True bila tabel blokir_kuis belum dibuat (migrasi belum dijalankan). Fitur blokir dilewati, kuis tetap jalan. */
export function tabelBlokirBelumAda(err: unknown): boolean {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' ? err.message : '';
  return pesan.includes('blokir_kuis') && (pesan.includes('does not exist') || pesan.includes('schema cache'));
}

type BarisBlokir = { jumlah: number; terblokir: boolean; jumlah_blokir: number };

function keKeadaan(baris: BarisBlokir | null): KeadaanBlokir | null {
  return baris ? { jumlah: baris.jumlah, terblokir: baris.terblokir, jumlahBlokir: baris.jumlah_blokir } : null;
}

/** Keadaan blokir satu siswa di satu kuis. `null` bila tidak ada baris atau tabel belum dibuat. */
export async function bacaBlokir(db: SupabaseClient, sesiId: string, siswaId: string): Promise<KeadaanBlokir | null> {
  const { data, error } = await db
    .from('blokir_kuis')
    .select('jumlah, terblokir, jumlah_blokir')
    .eq('sesi_id', sesiId)
    .eq('siswa_id', siswaId)
    .maybeSingle();
  if (error) {
    if (tabelBlokirBelumAda(error)) return null;
    throw error;
  }
  return keKeadaan(data as BarisBlokir | null);
}

/** `siswaId` harus dari sesi login. Mengembalikan keadaan terbaru, atau BLOKIR_KOSONG bila tabel belum ada. */
export async function catatPelanggaranSiswa(
  db: SupabaseClient,
  sesiId: string,
  siswaId: string,
): Promise<{ keadaan: KeadaanBlokir; tersedia: boolean }> {
  const lama = await bacaBlokir(db, sesiId, siswaId);
  const { keadaan, baruDiblokir } = tambahPelanggaranServer(lama);
  const { error } = await db.from('blokir_kuis').upsert(
    {
      sesi_id: sesiId,
      siswa_id: siswaId,
      jumlah: keadaan.jumlah,
      terblokir: keadaan.terblokir,
      jumlah_blokir: keadaan.jumlahBlokir,
      ...(baruDiblokir ? { diblokir_pada: new Date().toISOString() } : {}),
      diperbarui_pada: new Date().toISOString(),
    },
    { onConflict: 'sesi_id,siswa_id' },
  );
  if (error) {
    if (tabelBlokirBelumAda(error)) return { keadaan: BLOKIR_KOSONG, tersedia: false };
    throw error;
  }
  return { keadaan, tersedia: true };
}

/** Membuka blokir satu siswa. Mengembalikan false bila siswa itu memang tidak sedang terblokir. */
export async function bukaBlokirSiswa(db: SupabaseClient, sesiId: string, siswaId: string): Promise<boolean> {
  const lama = await bacaBlokir(db, sesiId, siswaId);
  if (!lama || !lama.terblokir) return false;
  const baru = bukaBlokirServer(lama);
  const { error } = await db
    .from('blokir_kuis')
    .update({
      jumlah: baru.jumlah,
      terblokir: baru.terblokir,
      dibuka_pada: new Date().toISOString(),
      diperbarui_pada: new Date().toISOString(),
    })
    .eq('sesi_id', sesiId)
    .eq('siswa_id', siswaId);
  if (error) throw error;
  return true;
}

export interface SiswaDiblokir {
  siswaId: string;
  jumlah: number;
  terblokir: boolean;
  jumlahBlokir: number;
  diblokirPada: string | null;
}

/** Semua siswa yang pernah meninggalkan halaman kuis, termasuk yang belum diblokir. */
export async function daftarDiblokir(db: SupabaseClient, sesiId: string): Promise<SiswaDiblokir[]> {
  const { data, error } = await db
    .from('blokir_kuis')
    .select('siswa_id, jumlah, terblokir, jumlah_blokir, diblokir_pada')
    .eq('sesi_id', sesiId)
    .gt('jumlah', 0);
  if (error) {
    if (tabelBlokirBelumAda(error)) return [];
    throw error;
  }
  return (
    data as {
      siswa_id: string;
      jumlah: number;
      terblokir: boolean;
      jumlah_blokir: number;
      diblokir_pada: string | null;
    }[]
  ).map((b) => ({
    siswaId: b.siswa_id,
    jumlah: b.jumlah,
    terblokir: b.terblokir,
    jumlahBlokir: b.jumlah_blokir,
    diblokirPada: b.diblokir_pada ?? null,
  }));
}
