import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hitungPendampingan } from '@/lib/pendampingan';
import type { DataPendampingan, Kelompok, StatusSesi } from '@/lib/tipe';

type BarisSesi = { id: string; status: string; dibuat_pada: string };
type BarisAnggota = { siswa_id: string };
type BarisPengguna = { id: string; nama: string };
type BarisHasil = { sesi_id: string; siswa_id: string; skor: number; kelompok: string };

/** Analitik pendampingan untuk satu kelas. Pemanggil wajib memverifikasi kepemilikan kelas. */
export async function dataPendampinganKelas(db: SupabaseClient, kelasId: string): Promise<DataPendampingan> {
  const [sesi, anggota] = await Promise.all([
    db.from('sesi_kuis').select('id, status, dibuat_pada').eq('kelas_id', kelasId),
    db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', kelasId),
  ]);
  if (sesi.error) throw sesi.error;
  if (anggota.error) throw anggota.error;

  const barisSesi = sesi.data as BarisSesi[];
  const idSiswa = (anggota.data as BarisAnggota[]).map((a) => a.siswa_id);

  let siswa: BarisPengguna[] = [];
  if (idSiswa.length > 0) {
    const r = await db.from('pengguna').select('id, nama').in('id', idSiswa);
    if (r.error) throw r.error;
    siswa = r.data as BarisPengguna[];
  }

  const idSesi = barisSesi.map((s) => s.id);
  let hasil: BarisHasil[] = [];
  if (idSesi.length > 0) {
    const r = await db.from('hasil_siswa').select('sesi_id, siswa_id, skor, kelompok').in('sesi_id', idSesi);
    if (r.error) throw r.error;
    hasil = r.data as BarisHasil[];
  }

  return hitungPendampingan({
    sesi: barisSesi.map((s) => ({
      id: s.id,
      status: s.status as StatusSesi,
      dibuatPada: s.dibuat_pada,
    })),
    hasil: hasil.map((h) => ({
      sesiId: h.sesi_id,
      siswaId: h.siswa_id,
      skor: h.skor,
      kelompok: h.kelompok as Kelompok,
    })),
    siswa,
  });
}
