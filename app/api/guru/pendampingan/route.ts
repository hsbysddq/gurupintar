import type { NextRequest } from 'next/server';
import { skemaQueryPendampingan } from '@/lib/skema-api';
import { idKelasMilikGuru, kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { dataPendampinganKelas } from '@/lib/server/pendampingan-kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { DataPendampingan } from '@/lib/tipe';

const PESAN_KELAS_TIDAK_ADA = 'Kelas tidak ditemukan.';
const PESAN_KUIS_TIDAK_ADA = 'Kuis selesai tidak ditemukan.';

// GET /api/guru/pendampingan?kelas=&sesi=; tanpa sesi memakai kuis selesai terbaru.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryPendampingan.safeParse({
    kelas: request.nextUrl.searchParams.get('kelas') ?? undefined,
    sesi: request.nextUrl.searchParams.get('sesi') ?? undefined,
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    let kelasId = input.data.kelas;
    if (kelasId) {
      if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
        return responsError(PESAN_KELAS_TIDAK_ADA, 404);
      }
    } else {
      const ids = await idKelasMilikGuru(db, auth.profil.id);
      if (ids.length === 0) {
        return responsOk<DataPendampingan>({
          siswa: [],
          ringkasan: {
            jumlahSiswa: 0,
            jumlahSesiSelesai: 0,
            jumlahMenjawab: 0,
            sesiTerpilihId: null,
            daftarSesi: [],
            jumlahPaham: 0,
            jumlahSetengah: 0,
            jumlahBelum: 0,
            jumlahTidakMengerjakan: 0,
          },
        });
      }
      kelasId = ids[0];
    }

    const data = await dataPendampinganKelas(db, kelasId, input.data.sesi);
    if (!data) return responsError(PESAN_KUIS_TIDAK_ADA, 404);
    return responsOk(data);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
