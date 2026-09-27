import { KELAS_DEMO_ID } from '@/lib/konstanta';
import { hitungPendampingan } from '@/lib/pendampingan';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, responsOk } from '@/lib/server/respons';
import type { Kelompok, StatusSesi } from '@/lib/tipe';

// GET /api/guru/pendampingan (PRD F-8, architecture.md 8.4). Hanya untuk guru; tidak dipakai halaman siswa.
export async function GET() {
  try {
    const db = ambilSupabase();
    const [sesi, siswa] = await Promise.all([
      db.from('sesi_kuis').select('id, status, dibuat_pada').eq('kelas_id', KELAS_DEMO_ID),
      db.from('siswa').select('id, nama').eq('kelas_id', KELAS_DEMO_ID),
    ]);
    if (sesi.error) return petakanErrorDb(sesi.error);
    if (siswa.error) return petakanErrorDb(siswa.error);

    const idSesi = sesi.data.map((s) => s.id as string);
    const hasil =
      idSesi.length > 0
        ? await db.from('hasil_siswa').select('sesi_id, siswa_id, skor, kelompok').in('sesi_id', idSesi)
        : { data: [], error: null };
    if (hasil.error) return petakanErrorDb(hasil.error);

    return responsOk(
      hitungPendampingan({
        sesi: sesi.data.map((s) => ({ id: s.id, status: s.status as StatusSesi, dibuatPada: s.dibuat_pada })),
        hasil: hasil.data.map((h) => ({
          sesiId: h.sesi_id,
          siswaId: h.siswa_id,
          skor: h.skor,
          kelompok: h.kelompok as Kelompok,
        })),
        siswa: siswa.data.map((s) => ({ id: s.id, nama: s.nama })),
      }),
    );
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
