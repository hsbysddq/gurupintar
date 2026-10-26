import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataDetailMapel, HasilDetail, SesiDetail } from '@/lib/detail-mapel';
import { tentukanStatusMateriSiswa } from '@/lib/status-materi-siswa';
import type { Kelompok, StatusSesi } from '@/lib/tipe';
import { kolomArsipBelumAda } from './auth';
import { ambilPercobaanSiswa } from './percobaan';

type BarisKelas = { id: string; nama: string; mapel: string; guru_id: string };
type BarisSesi = { id: string; kode_kelas: string; status: string; dibuat_pada: string; topik: unknown };
type BarisHasil = { sesi_id: string; skor: number; total: number; kelompok: Kelompok; dikirim_pada: string };
type BarisMateri = { sesi_id: string; kelompok: Kelompok };

export interface HasilMuatDetailMapel {
  data: DataDetailMapel;
}

function namaTopikDari(nilai: unknown): string {
  if (Array.isArray(nilai)) return (nilai[0] as { nama?: string } | undefined)?.nama ?? '';
  return (nilai as { nama?: string } | null)?.nama ?? '';
}

/**
 * Data satu mata pelajaran untuk siswa yang login: kuis, hasil milik siswa, dan status materinya.
 * Mengembalikan null bila siswa bukan anggota kelas ini atau kelasnya diarsipkan.
 * `siswaId` harus dari sesi login di server. Kelompok hanya dipakai di sini untuk menentukan status
 * materi dan tidak pernah ikut dikirim keluar.
 */
export async function ambilDataDetailMapel(
  db: SupabaseClient,
  siswaId: string,
  kelasId: string,
): Promise<HasilMuatDetailMapel | null> {
  const anggota = await db.from('keanggotaan_kelas').select('kelas_id').eq('siswa_id', siswaId);
  if (anggota.error) throw anggota.error;
  const idKelas = [...new Set(anggota.data.map((a) => a.kelas_id as string))];
  if (!idKelas.includes(kelasId)) return null;

  const dasarKelas = () => db.from('kelas').select('id, nama, mapel, guru_id').in('id', idKelas);
  let kelas = await dasarKelas().is('diarsipkan_pada', null);
  if (kelas.error && kolomArsipBelumAda(kelas.error)) kelas = await dasarKelas();
  if (kelas.error) throw kelas.error;
  const semuaKelas = kelas.data as BarisKelas[];
  const ini = semuaKelas.find((k) => k.id === kelasId);
  if (!ini) return null;

  const [guru, sesi] = await Promise.all([
    db.from('pengguna').select('nama').eq('id', ini.guru_id).maybeSingle(),
    db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada, topik(nama)')
      .eq('kelas_id', kelasId)
      .order('dibuat_pada', { ascending: false }),
  ]);
  if (guru.error) throw guru.error;
  if (sesi.error) throw sesi.error;

  const barisSesi = sesi.data as BarisSesi[];
  const idSesi = barisSesi.map((s) => s.id);

  let barisHasil: BarisHasil[] = [];
  let barisMateri: BarisMateri[] = [];
  if (idSesi.length > 0) {
    const [hasil, materi] = await Promise.all([
      ambilPercobaanSiswa<BarisHasil>(db, siswaId, 'sesi_id, skor, total, kelompok, dikirim_pada', { idSesi }),
      db.from('materi').select('sesi_id, kelompok').in('sesi_id', idSesi).eq('status', 'dibagikan'),
    ]);
    if (materi.error) throw materi.error;
    barisHasil = hasil;
    barisMateri = materi.data as BarisMateri[];
  }

  // Status materi mengikuti percobaan terakhir di tiap kuis.
  const hasilPerSesi = new Map<string, BarisHasil>();
  for (const h of barisHasil) {
    const lama = hasilPerSesi.get(h.sesi_id);
    if (!lama || h.dikirim_pada > lama.dikirim_pada) hasilPerSesi.set(h.sesi_id, h);
  }
  const materiPerSesi = new Map<string, { kelompok: Kelompok }[]>();
  for (const m of barisMateri) {
    const daftar = materiPerSesi.get(m.sesi_id) ?? [];
    daftar.push({ kelompok: m.kelompok });
    materiPerSesi.set(m.sesi_id, daftar);
  }

  const daftarSesi: SesiDetail[] = barisSesi.map((s) => ({
    id: s.id,
    kodeKelas: s.kode_kelas,
    status: s.status as StatusSesi,
    dibuatPada: s.dibuat_pada,
    namaTopik: namaTopikDari(s.topik),
    statusMateri: tentukanStatusMateriSiswa(hasilPerSesi.get(s.id), materiPerSesi.get(s.id) ?? []),
  }));
  const daftarHasil: HasilDetail[] = barisHasil.map((h) => ({
    sesiId: h.sesi_id,
    skor: h.skor,
    total: h.total,
    dikirimPada: h.dikirim_pada,
  }));

  return {
    data: {
      kelas: { id: ini.id, nama: ini.nama, mapel: ini.mapel, namaGuru: (guru.data?.nama as string | undefined) ?? '' },
      sesi: daftarSesi,
      hasil: daftarHasil,
    },
  };
}
