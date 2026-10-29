import type { NextRequest } from 'next/server';
import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { SOAL_MINIMAL_TOPIK, TOPIK_DEMO_ID } from '@/lib/konstanta';
import { skemaBodyBukaSesi, skemaQueryKelasOpsional } from '@/lib/skema-api';
import { bolehPakaiTopik } from '@/lib/topik';
import { idKelasMilikGuru, kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { SesiBaru, SesiGuru, StatusSesi } from '@/lib/tipe';

const PESAN_KODE_GAGAL = 'Kode kelas belum berhasil dibuat. Coba buka kuis lagi.';
const PESAN_TOPIK_TIDAK_ADA = 'Topik tidak ditemukan.';
const PESAN_JUMLAH_SOAL = `Topik harus punya minimal ${SOAL_MINIMAL_TOPIK} soal.`;
const PESAN_BELUM_PUNYA_KELAS = 'Buat kelas dulu sebelum membuka kuis.';

// GET /api/guru/sesi?kelas=: sesi milik guru, terbaru di atas, beserta jumlah siswa yang menjawab.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryKelasOpsional.safeParse({
    kelas: request.nextUrl.searchParams.get('kelas') ?? undefined,
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    let ids: string[];
    if (input.data.kelas) {
      if (!(await kelasMilikGuru(db, auth.profil.id, input.data.kelas))) {
        return responsError('Kelas tidak ditemukan.', 404);
      }
      ids = [input.data.kelas];
    } else {
      ids = await idKelasMilikGuru(db, auth.profil.id);
    }
    if (ids.length === 0) return responsOk<SesiGuru[]>([]);

    const { data, error } = await db
      .from('sesi_kuis')
      .select('id, kelas_id, kode_kelas, status, dibuat_pada, kelas(nama), hasil_siswa(count)')
      .in('kelas_id', ids)
      .order('dibuat_pada', { ascending: false });
    if (error) return petakanErrorDb(error);

    const respons: SesiGuru[] = data.map((s) => ({
      id: s.id,
      kelasId: s.kelas_id,
      namaKelas: (s.kelas as unknown as { nama: string }).nama,
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

// POST /api/guru/sesi: buka_sesi menutup kuis aktif lain di kelas yang sama dan membuat yang baru
// dalam satu transaksi. Kode bentrok dicoba ulang dengan kode baru, maksimal 5 kali.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyBukaSesi.safeParse((await bacaBodyJson(request)) ?? {});
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const topikId = input.data.topikId ?? TOPIK_DEMO_ID;

  try {
    const db = ambilSupabase();
    let kelasId = input.data.kelasId;
    if (kelasId) {
      if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
        return responsError('Kelas tidak ditemukan.', 404);
      }
    } else {
      const ids = await idKelasMilikGuru(db, auth.profil.id);
      if (ids.length === 0) return responsError(PESAN_BELUM_PUNYA_KELAS, 400);
      kelasId = ids[0];
    }

    const topik = await db
      .from('topik')
      .select('id, dibuat_oleh, soal(count)')
      .eq('id', topikId)
      .maybeSingle();
    if (topik.error) return petakanErrorDb(topik.error);
    if (!topik.data) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
    if (!bolehPakaiTopik({ id: topik.data.id, dibuatOleh: topik.data.dibuat_oleh }, auth.profil.id)) {
      return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
    }
    const jumlahSoal = (topik.data.soal as { count: number }[])[0]?.count ?? 0;
    if (jumlahSoal < SOAL_MINIMAL_TOPIK) return responsError(PESAN_JUMLAH_SOAL, 400);

    const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      const { data, error } = await db.rpc('buka_sesi', {
        p_kelas: kelasId,
        p_topik: topikId,
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
