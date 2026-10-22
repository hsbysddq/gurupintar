import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ambilKelasGuru } from './kelas';
import { dataPendampinganKelas } from './pendampingan-kelas';
import type { RingkasanKelas } from '@/lib/tipe';

type BarisSesi = { kelas_id: string; dibuat_pada: string };

/** Ringkasan lintas kelas: progres kuis aktif, jumlah sesi, dan siswa yang perlu pendampingan. */
export async function ambilRingkasanKelas(db: SupabaseClient, guruId: string): Promise<RingkasanKelas[]> {
  const daftar = await ambilKelasGuru(db, guruId);
  if (daftar.length === 0) return [];

  const ids = daftar.map((k) => k.id);
  const sesi = await db
    .from('sesi_kuis')
    .select('kelas_id, dibuat_pada')
    .in('kelas_id', ids)
    .order('dibuat_pada', { ascending: false });
  if (sesi.error) throw sesi.error;
  const barisSesi = sesi.data as BarisSesi[];

  const pendampingan = await Promise.all(daftar.map((k) => dataPendampinganKelas(db, k.id)));

  return daftar.map((kelas, i) => {
    const sesiKelas = barisSesi.filter((s) => s.kelas_id === kelas.id);
    return {
      id: kelas.id,
      nama: kelas.nama,
      mapel: kelas.mapel,
      jumlahSiswa: kelas.jumlahSiswa,
      kuisAktif: kelas.kuisAktif,
      jumlahPerluPendampingan: pendampingan[i].perluPendampingan.length,
      jumlahSesi: sesiKelas.length,
      sesiTerakhir: sesiKelas[0]?.dibuat_pada ?? null,
    };
  });
}
