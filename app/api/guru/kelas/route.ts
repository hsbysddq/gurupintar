import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { skemaBodyBuatKelas } from '@/lib/skema-api';
import { wajibPeranApi } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { KelasRingkas } from '@/lib/tipe';

const PESAN_KODE_GAGAL = 'Kode undangan kelas belum berhasil dibuat. Coba lagi.';

// GET /api/guru/kelas: hanya kelas milik guru yang login.
export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  try {
    const daftar = await ambilKelasGuru(ambilSupabase(), auth.profil.id);
    return responsOk(daftar);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// POST /api/guru/kelas: kode undangan unik dicoba ulang maksimal 5 kali.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyBuatKelas.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      const { data, error } = await db
        .from('kelas')
        .insert({
          guru_id: auth.profil.id,
          nama: input.data.nama,
          mapel: input.data.mapel,
          kode_undangan: kode,
        })
        .select('id')
        .single();
      if (!error) return { status: 'berhasil', nilai: data.id as string };
      return adalahBentrokKode(error) ? { status: 'bentrok' } : { status: 'gagal', error };
    });

    if (hasil.status === 'habis') return responsError(PESAN_KODE_GAGAL, 500);
    if (hasil.status === 'gagal') return petakanErrorDb(hasil.error);

    const respons: KelasRingkas = {
      id: hasil.nilai,
      nama: input.data.nama,
      mapel: input.data.mapel,
      kodeUndangan: hasil.kode,
      jumlahSiswa: 0,
      kuisAktif: null,
    };
    return responsOk(respons, 201);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
