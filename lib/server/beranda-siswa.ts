import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataBeranda, HasilBeranda, KelasBeranda, SesiBeranda } from '@/lib/beranda-siswa';
import type { Kelompok } from '@/lib/tipe';
import { kolomArsipBelumAda } from './auth';

type BarisKelas = { id: string; nama: string; mapel: string; guru_id: string };
type BarisSesi = { id: string; kelas_id: string; kode_kelas: string; status: string };
type BarisHasil = {
  sesi_id: string;
  skor: number;
  total: number;
  kelompok: Kelompok;
  dikirim_pada: string;
  sesi_kuis: { topik: { nama: string } | { nama: string }[] | null } | { topik: unknown }[] | null;
};

function namaTopikDari(sesi: BarisHasil['sesi_kuis']): string {
  const baris = Array.isArray(sesi) ? sesi[0] : sesi;
  const topik = (baris as { topik?: unknown } | null | undefined)?.topik;
  const satu = Array.isArray(topik) ? topik[0] : topik;
  return (satu as { nama?: string } | null | undefined)?.nama ?? 'Kuis';
}

/**
 * Data mentah beranda siswa: kelas aktif yang diikuti, semua kuis di kelas itu, dan hasil milik siswa.
 * `siswaId` harus berasal dari sesi login di server, bukan dari browser.
 */
export async function ambilDataBerandaSiswa(db: SupabaseClient, siswaId: string): Promise<DataBeranda> {
  const anggota = await db.from('keanggotaan_kelas').select('kelas_id').eq('siswa_id', siswaId);
  if (anggota.error) throw anggota.error;
  const idKelas = [...new Set(anggota.data.map((a) => a.kelas_id as string))];
  if (idKelas.length === 0) return { kelas: [], sesi: [], hasil: [] };

  const dasarKelas = () => db.from('kelas').select('id, nama, mapel, guru_id').in('id', idKelas);
  let kelas = await dasarKelas().is('diarsipkan_pada', null);
  if (kelas.error && kolomArsipBelumAda(kelas.error)) kelas = await dasarKelas();
  if (kelas.error) throw kelas.error;
  const barisKelas = kelas.data as BarisKelas[];
  if (barisKelas.length === 0) return { kelas: [], sesi: [], hasil: [] };

  const idAktif = barisKelas.map((k) => k.id);
  const idGuru = [...new Set(barisKelas.map((k) => k.guru_id))];

  const [guru, sesi] = await Promise.all([
    db.from('pengguna').select('id, nama').in('id', idGuru),
    db.from('sesi_kuis').select('id, kelas_id, kode_kelas, status').in('kelas_id', idAktif),
  ]);
  if (guru.error) throw guru.error;
  if (sesi.error) throw sesi.error;

  const barisSesi = sesi.data as BarisSesi[];
  const idSesi = barisSesi.map((s) => s.id);

  let barisHasil: BarisHasil[] = [];
  if (idSesi.length > 0) {
    const hasil = await db
      .from('hasil_siswa')
      .select('sesi_id, skor, total, kelompok, dikirim_pada, sesi_kuis(topik(nama))')
      .eq('siswa_id', siswaId)
      .in('sesi_id', idSesi);
    if (hasil.error) throw hasil.error;
    barisHasil = hasil.data as unknown as BarisHasil[];
  }

  const petaGuru = new Map(guru.data.map((g) => [g.id as string, g.nama as string]));

  const daftarKelas: KelasBeranda[] = barisKelas
    .map((k) => ({ id: k.id, nama: k.nama, mapel: k.mapel, namaGuru: petaGuru.get(k.guru_id) ?? '' }))
    .sort((a, b) => a.mapel.localeCompare(b.mapel, 'id', { sensitivity: 'base' }));
  const daftarSesi: SesiBeranda[] = barisSesi.map((s) => ({
    id: s.id,
    kelasId: s.kelas_id,
    kodeAktif: s.status === 'aktif' ? s.kode_kelas : null,
  }));
  const daftarHasil: HasilBeranda[] = barisHasil.map((h) => ({
    sesiId: h.sesi_id,
    kelompok: h.kelompok,
    skor: h.skor,
    total: h.total,
    dikirimPada: h.dikirim_pada,
    namaTopik: namaTopikDari(h.sesi_kuis),
  }));

  return { kelas: daftarKelas, sesi: daftarSesi, hasil: daftarHasil };
}
