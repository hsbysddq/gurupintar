import { kolomArsipBelumAda, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { ambilPercobaanSiswa } from '@/lib/server/percobaan';
import { petakanErrorDb, responsOk } from '@/lib/server/respons';
import type { RiwayatKuis } from '@/lib/riwayat-siswa';
import type { MapelDiRiwayat, ResponsRiwayat } from '@/lib/status-mapel';

type BarisRiwayat = {
  sesi_id: string;
  skor: number;
  total: number;
  dikirim_pada: string;
  sesi_kuis: { kelas_id: string; kelas: { nama: string; mapel: string } | null; topik: { nama: string } | null } | null;
};

// GET /api/siswa/riwayat: riwayat semua pengerjaan kuis milik siswa yang login (siswaId dari sesi login, bukan
// dari browser). Kerjakan ulang tercatat sebagai baris tersendiri, jadi hasil pertama tidak hilang.
// Hanya skor dan nama; kolom `kelompok` sengaja tidak dipilih agar tidak pernah sampai ke siswa (D-2).
export async function GET() {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  try {
    const data = await ambilPercobaanSiswa<BarisRiwayat>(
      ambilSupabase(),
      auth.profil.id,
      'sesi_id, skor, total, dikirim_pada, sesi_kuis(kelas_id, kelas(nama, mapel), topik(nama))',
      { terbaruDulu: true, batas: 100 },
    );

    const respons: RiwayatKuis[] = data.map((b) => ({
      sesiId: b.sesi_id,
      kelasId: b.sesi_kuis?.kelas_id,
      dikirimPada: b.dikirim_pada,
      namaMapel: b.sesi_kuis?.kelas?.mapel,
      namaKelas: b.sesi_kuis?.kelas?.nama ?? 'Kelas',
      namaTopik: b.sesi_kuis?.topik?.nama ?? 'Kuis',
      skor: b.skor,
      total: b.total,
    }));

    const db = ambilSupabase();
    const anggota = await db.from('keanggotaan_kelas').select('kelas_id').eq('siswa_id', auth.profil.id);
    if (anggota.error) return petakanErrorDb(anggota.error);
    const idKelas = [...new Set(anggota.data.map((a) => a.kelas_id as string))];

    let mapel: MapelDiRiwayat[] = [];
    if (idKelas.length > 0) {
      const dasarKelas = () => db.from('kelas').select('id, nama, mapel').in('id', idKelas);
      let kelas = await dasarKelas().is('diarsipkan_pada', null);
      if (kelas.error && kolomArsipBelumAda(kelas.error)) kelas = await dasarKelas();
      if (kelas.error) return petakanErrorDb(kelas.error);
      const sesi = await db.from('sesi_kuis').select('id, kelas_id, dibuat_pada').in('kelas_id', idKelas);
      if (sesi.error) return petakanErrorDb(sesi.error);
      mapel = kelas.data.map((k) => ({
        kelasId: k.id as string,
        namaMapel: k.mapel as string,
        namaKelas: k.nama as string,
        sesi: sesi.data
          .filter((s) => s.kelas_id === k.id)
          .map((s) => ({ sesiId: s.id as string, dibuatPada: s.dibuat_pada as string })),
      }));
    }

    return responsOk<ResponsRiwayat>({ riwayat: respons, mapel });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
