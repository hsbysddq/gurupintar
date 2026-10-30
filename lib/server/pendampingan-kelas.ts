import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hitungPendampingan } from '@/lib/pendampingan';
import { tabelBelumAda } from '@/lib/server/respons';
import type {
  DataPendampingan,
  KategoriPemahaman,
  StatusSesi,
  TindakanPendampingan,
} from '@/lib/tipe';

type BarisSesi = { id: string; status: string; dibuat_pada: string };
type BarisAnggota = { siswa_id: string };
type BarisPengguna = { id: string; nama: string };
type BarisHasil = { sesi_id: string; siswa_id: string; skor: number; total: number };
type BarisTindakan = {
  siswa_id: string;
  sesi_terakhir_id: string;
  kategori: string;
  tindakan: string;
};

/** Analitik pendampingan untuk satu kelas. Pemanggil wajib memverifikasi kepemilikan kelas. */
export async function dataPendampinganKelas(db: SupabaseClient, kelasId: string): Promise<DataPendampingan> {
  const [sesi, anggota, tindakan] = await Promise.all([
    db.from('sesi_kuis').select('id, status, dibuat_pada').eq('kelas_id', kelasId),
    db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', kelasId),
    db
      .from('tindakan_pendampingan')
      .select('siswa_id, sesi_terakhir_id, kategori, tindakan')
      .eq('kelas_id', kelasId),
  ]);
  if (sesi.error) throw sesi.error;
  if (anggota.error) throw anggota.error;

  let barisTindakan: BarisTindakan[] = [];
  let perluMigrasi = false;
  if (tindakan.error) {
    if (tabelBelumAda(tindakan.error)) perluMigrasi = true;
    else throw tindakan.error;
  } else {
    barisTindakan = tindakan.data as BarisTindakan[];
  }

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
    const r = await db
      .from('hasil_siswa')
      .select('sesi_id, siswa_id, skor, total')
      .in('sesi_id', idSesi);
    if (r.error) throw r.error;
    hasil = r.data as BarisHasil[];
  }

  const data = hitungPendampingan({
    sesi: barisSesi.map((s) => ({
      id: s.id,
      status: s.status as StatusSesi,
      dibuatPada: s.dibuat_pada,
    })),
    hasil: hasil.map((h) => ({
      sesiId: h.sesi_id,
      siswaId: h.siswa_id,
      skor: h.skor,
      total: h.total,
    })),
    siswa,
    tindakan: barisTindakan.map((t) => ({
      siswaId: t.siswa_id,
      sesiTerakhirId: t.sesi_terakhir_id,
      kategori: t.kategori as KategoriPemahaman,
      tindakan: t.tindakan as TindakanPendampingan,
    })),
  });

  if (perluMigrasi) data.ringkasan.perluMigrasi = true;
  return data;
}
