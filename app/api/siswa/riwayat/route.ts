import { wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, responsOk } from '@/lib/server/respons';
import type { RiwayatKuis } from '@/lib/riwayat-siswa';

type BarisRiwayat = {
  sesi_id: string;
  skor: number;
  total: number;
  dikirim_pada: string;
  sesi_kuis: { kelas: { nama: string } | null; topik: { nama: string } | null } | null;
};

// GET /api/siswa/riwayat: riwayat kuis milik siswa yang login (siswaId dari sesi login, bukan dari browser).
// Hanya skor dan nama; kolom `kelompok` sengaja tidak dipilih agar tidak pernah sampai ke siswa (D-2).
export async function GET() {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  try {
    const { data, error } = await ambilSupabase()
      .from('hasil_siswa')
      .select('sesi_id, skor, total, dikirim_pada, sesi_kuis(kelas(nama), topik(nama))')
      .eq('siswa_id', auth.profil.id)
      .order('dikirim_pada', { ascending: false })
      .limit(100);
    if (error) return petakanErrorDb(error);

    const respons: RiwayatKuis[] = (data as unknown as BarisRiwayat[]).map((b) => ({
      sesiId: b.sesi_id,
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
