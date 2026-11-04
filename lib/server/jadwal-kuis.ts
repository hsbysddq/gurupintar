import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { statusSesiEfektif, type JadwalKuis } from '@/lib/jadwal-kuis';
import type { StatusSesi } from '@/lib/tipe';

type BarisJadwal = { sesi_id: string; buka_pada: string; tutup_pada: string | null };

export function tabelJadwalBelumAda(err: unknown): boolean {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' ? err.message : '';
  return pesan.includes('jadwal_kuis') && (pesan.includes('does not exist') || pesan.includes('schema cache'));
}

function keJadwal(baris: BarisJadwal): JadwalKuis {
  return { bukaPada: baris.buka_pada, tutupPada: baris.tutup_pada };
}

/** Jadwal banyak sesi sekaligus. Tabel yang belum dimigrasikan dianggap tidak punya jadwal. */
export async function bacaJadwalBanyak(
  db: SupabaseClient,
  sesiIds: readonly string[],
): Promise<Map<string, JadwalKuis>> {
  if (sesiIds.length === 0) return new Map();
  const { data, error } = await db
    .from('jadwal_kuis')
    .select('sesi_id, buka_pada, tutup_pada')
    .in('sesi_id', [...sesiIds]);
  if (error) {
    if (tabelJadwalBelumAda(error)) return new Map();
    throw error;
  }
  return new Map((data as BarisJadwal[]).map((baris) => [baris.sesi_id, keJadwal(baris)]));
}

export async function bacaJadwalSesi(db: SupabaseClient, sesiId: string): Promise<JadwalKuis | null> {
  const peta = await bacaJadwalBanyak(db, [sesiId]);
  return peta.get(sesiId) ?? null;
}

/**
 * Menutup semua sesi yang sudah melewati `tutup_pada`. Dipanggil saat daftar/dashboard dibaca,
 * jadi status di database ikut berubah tanpa menunggu guru menekan tombol tutup.
 */
export async function tutupSesiKedaluwarsa(
  db: SupabaseClient,
  opsi: { kelasId?: string; sesiIds?: readonly string[] } = {},
): Promise<number> {
  let kandidat = opsi.sesiIds ? [...opsi.sesiIds] : null;
  if (opsi.kelasId) {
    const sesi = await db
      .from('sesi_kuis')
      .select('id')
      .eq('kelas_id', opsi.kelasId)
      .eq('status', 'aktif');
    if (sesi.error) throw sesi.error;
    kandidat = (sesi.data as { id: string }[]).map((s) => s.id);
    if (kandidat.length === 0) return 0;
  }
  if (kandidat && kandidat.length === 0) return 0;

  let kueri = db
    .from('jadwal_kuis')
    .select('sesi_id')
    .not('tutup_pada', 'is', null)
    .lte('tutup_pada', new Date().toISOString());
  if (kandidat) kueri = kueri.in('sesi_id', kandidat);

  const { data, error } = await kueri;
  if (error) {
    if (tabelJadwalBelumAda(error)) return 0;
    throw error;
  }
  const ids = (data as { sesi_id: string }[]).map((baris) => baris.sesi_id);
  if (ids.length === 0) return 0;

  const { error: galatUpdate } = await db
    .from('sesi_kuis')
    .update({ status: 'selesai' })
    .in('id', ids)
    .eq('status', 'aktif');
  if (galatUpdate) throw galatUpdate;
  return ids.length;
}

/** Status sesi setelah mempertimbangkan jadwal, sekaligus menandai selesai bila waktunya lewat. */
export async function statusAksesSesi(
  db: SupabaseClient,
  sesi: { id: string; status: string },
  sekarang: Date = new Date(),
): Promise<{ status: StatusSesi; jadwal: JadwalKuis | null }> {
  if (sesi.status === 'selesai') return { status: 'selesai', jadwal: null };

  const jadwal = await bacaJadwalSesi(db, sesi.id);
  const status = statusSesiEfektif(sesi.status === 'aktif' ? 'aktif' : 'selesai', jadwal ?? undefined, sekarang);

  if (status === 'selesai' && sesi.status === 'aktif') {
    // Gagal menandai selesai tidak boleh membuat siswa tetap bisa menjawab; status akses tetap ditolak.
    await db.from('sesi_kuis').update({ status: 'selesai' }).eq('id', sesi.id).eq('status', 'aktif');
  }

  return { status, jadwal };
}

export async function simpanJadwalSesi(
  db: SupabaseClient,
  sesiId: string,
  jadwal: JadwalKuis,
): Promise<{ ok: true } | { ok: false; tabelBelumAda: boolean; error: unknown }> {
  const { error } = await db.from('jadwal_kuis').upsert(
    {
      sesi_id: sesiId,
      buka_pada: jadwal.bukaPada ?? new Date().toISOString(),
      tutup_pada: jadwal.tutupPada,
      diperbarui_pada: new Date().toISOString(),
    },
    { onConflict: 'sesi_id' },
  );
  if (error) return { ok: false, tabelBelumAda: tabelJadwalBelumAda(error), error };
  return { ok: true };
}
