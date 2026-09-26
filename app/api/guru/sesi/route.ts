import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { KELAS_DEMO_ID, TOPIK_DEMO_ID } from '@/lib/konstanta';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, responsError, responsOk } from '@/lib/server/respons';
import type { SesiBaru, SesiGuru, StatusSesi } from '@/lib/tipe';

const PESAN_KODE_GAGAL = 'Kode kelas belum berhasil dibuat. Coba buka kuis lagi.';

// GET /api/guru/sesi (PRD AC-4.1): sesi kelas demo, terbaru di atas, beserta jumlah siswa yang menjawab.
export async function GET() {
  try {
    const db = ambilSupabase();
    const { data, error } = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada, hasil_siswa(count)')
      .eq('kelas_id', KELAS_DEMO_ID)
      .order('dibuat_pada', { ascending: false });
    if (error) return petakanErrorDb(error);

    const respons: SesiGuru[] = data.map((s) => ({
      id: s.id,
      kodeKelas: s.kode_kelas,
      status: s.status as StatusSesi,
      dibuatPada: s.dibuat_pada,
      jumlahMenjawab: (s.hasil_siswa as { count: number }[])[0]?.count ?? 0,
    }));
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// POST /api/guru/sesi (PRD AC-4.2, AC-4.3): buka_sesi menutup kuis aktif lain dan membuat yang baru
// dalam satu transaksi. Kode bentrok dicoba ulang dengan kode baru, maksimal 5 kali (architecture.md 7.4).
export async function POST() {
  try {
    const db = ambilSupabase();
    const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      const { data, error } = await db.rpc('buka_sesi', {
        p_kelas: KELAS_DEMO_ID,
        p_topik: TOPIK_DEMO_ID,
        p_kode: kode,
      });
      if (!error) return { status: 'berhasil', nilai: data as string };
      return adalahBentrokKode(error) ? { status: 'bentrok' } : { status: 'gagal', error };
    });

    if (hasil.status === 'habis') return responsError(PESAN_KODE_GAGAL, 500);
    if (hasil.status === 'gagal') return petakanErrorDb(hasil.error);

    const respons: SesiBaru = { id: hasil.nilai, kodeKelas: hasil.kode };
    return responsOk(respons, 201);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
