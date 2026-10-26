import { wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { ambilPercobaanSiswa } from '@/lib/server/percobaan';
import { petakanErrorDb, responsOk } from '@/lib/server/respons';
import type { RiwayatKuis } from '@/lib/riwayat-siswa';

type BarisRiwayat = {
  sesi_id: string;
  skor: number;
  total: number;
  dikirim_pada: string;
  sesi_kuis: { kelas_id: string; kelas: { nama: string } | null; topik: { nama: string } | null } | null;
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
      'sesi_id, skor, total, dikirim_pada, sesi_kuis(kelas_id, kelas(nama), topik(nama))',
      { terbaruDulu: true, batas: 100 },
    );

    const respons: RiwayatKuis[] = data.map((b) => ({
      sesiId: b.sesi_id,
      kelasId: b.sesi_kuis?.kelas_id,
      dikirimPada: b.dikirim_pada,
      namaKelas: b.sesi_kuis?.kelas?.nama ?? 'Kelas',
      namaTopik: b.sesi_kuis?.topik?.nama ?? 'Kuis',
      skor: b.skor,
      total: b.total,
    }));
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
