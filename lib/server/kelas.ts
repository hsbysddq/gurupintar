import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { KelasRingkas } from '@/lib/tipe';

type BarisKelas = {
  id: string;
  nama: string;
  mapel: string;
  kode_undangan: string;
  keanggotaan_kelas: { count: number }[];
};

type BarisSesiAktif = { id: string; kelas_id: string; kode_kelas: string };

/** Semua kelas milik guru, lengkap dengan jumlah siswa dan sesi aktifnya. */
export async function ambilKelasGuru(db: SupabaseClient, guruId: string): Promise<KelasRingkas[]> {
  const { data, error } = await db
    .from('kelas')
    .select('id, nama, mapel, kode_undangan, keanggotaan_kelas(count)')
    .eq('guru_id', guruId)
    .order('nama');
  if (error) throw error;

  const daftar = data as BarisKelas[];
  const ids = daftar.map((k) => k.id);

  let sesiAktif: BarisSesiAktif[] = [];
  if (ids.length > 0) {
    const sesi = await db
      .from('sesi_kuis')
      .select('id, kelas_id, kode_kelas')
      .in('kelas_id', ids)
      .eq('status', 'aktif');
    if (sesi.error) throw sesi.error;
    sesiAktif = sesi.data as BarisSesiAktif[];
  }

  return daftar.map((k) => {
    const aktif = sesiAktif.find((s) => s.kelas_id === k.id);
    return {
      id: k.id,
      nama: k.nama,
      mapel: k.mapel,
      kodeUndangan: k.kode_undangan,
      jumlahSiswa: k.keanggotaan_kelas[0]?.count ?? 0,
      kuisAktif: aktif ? { id: aktif.id, kodeKelas: aktif.kode_kelas } : null,
    };
  });
}
