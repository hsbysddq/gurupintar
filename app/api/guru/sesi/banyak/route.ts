import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { SOAL_MINIMAL_TOPIK, TOPIK_DEMO_ID } from '@/lib/konstanta';
import { skemaBodyBukaSesiBanyak } from '@/lib/skema-api';
import { bolehPakaiTopik } from '@/lib/topik';
import { wajibPeranApi, kolomArsipBelumAda } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { SesiBanyakBaru } from '@/lib/tipe';

const PESAN_KODE_GAGAL = 'Kode kelas belum berhasil dibuat. Coba lagi.';
const PESAN_TOPIK_TIDAK_ADA = 'Topik tidak ditemukan.';
const PESAN_JUMLAH_SOAL = `Topik harus punya minimal ${SOAL_MINIMAL_TOPIK} soal.`;
const PESAN_KELAS_TIDAK_ADA = 'Sebagian kelas tidak ditemukan.';

// POST /api/guru/sesi/banyak: buka satu topik untuk beberapa kelas sekaligus.
// Setiap kelas mendapat sesi dan kode sendiri. Jika satu kelas gagal, kelas lain tetap diproses
// dan hasilnya dilaporkan per kelas agar guru bisa mencoba ulang yang gagal saja.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyBukaSesiBanyak.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const topikId = input.data.topikId ?? TOPIK_DEMO_ID;
  const ids = input.data.kelasIds;

  try {
    const db = ambilSupabase();

    const dasar = () =>
      db.from('kelas').select('id, nama').in('id', ids).eq('guru_id', auth.profil.id);
    let hasil = await dasar().is('diarsipkan_pada', null);
    if (hasil.error && kolomArsipBelumAda(hasil.error)) hasil = await dasar();
    if (hasil.error) return petakanErrorDb(hasil.error);

    const kelas = hasil.data;
    const namaKelas = new Map<string, string>(kelas.map((k) => [k.id as string, k.nama as string]));
    if (namaKelas.size !== ids.length) return responsError(PESAN_KELAS_TIDAK_ADA, 404);

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

    const respons: SesiBanyakBaru = { sesi: [], gagal: [] };

    for (const kelasId of ids) {
      const nama = namaKelas.get(kelasId)!;
      const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
        const { data, error } = await db.rpc('buka_sesi', {
          p_kelas: kelasId,
          p_topik: topikId,
          p_kode: kode,
        });
        if (!error) return { status: 'berhasil', nilai: data as string };
        return adalahBentrokKode(error) ? { status: 'bentrok' } : { status: 'gagal', error };
      });

      if (hasil.status === 'berhasil') {
        respons.sesi.push({ kelasId, namaKelas: nama, id: hasil.nilai, kodeKelas: hasil.kode });
      } else {
        if (hasil.status === 'gagal') {
          console.error('Buka sesi gagal untuk kelas:', kelasId, hasil.error);
        }
        respons.gagal.push({ kelasId, namaKelas: nama, pesan: PESAN_KODE_GAGAL });
      }
    }

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
