import type { NextRequest } from 'next/server';
import { hitungPendampingan } from '@/lib/pendampingan';
import { skemaQueryKelasOpsional } from '@/lib/skema-api';
import { idKelasMilikGuru, kelasMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { DataPendampingan, Kelompok, StatusSesi } from '@/lib/tipe';

// GET /api/guru/pendampingan?kelas= (PRD F-8, architecture.md 8.4). Hanya guru pemilik kelas.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryKelasOpsional.safeParse({
    kelas: request.nextUrl.searchParams.get('kelas') ?? undefined,
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    let kelasId = input.data.kelas;
    if (kelasId) {
      if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
        return responsError('Kelas tidak ditemukan.', 404);
      }
    } else {
      const ids = await idKelasMilikGuru(db, auth.profil.id);
      if (ids.length === 0) return responsOk<DataPendampingan>({ perluPendampingan: [], kemajuan: [] });
      kelasId = ids[0];
    }

    const [sesi, anggota] = await Promise.all([
      db.from('sesi_kuis').select('id, status, dibuat_pada').eq('kelas_id', kelasId),
      db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', kelasId),
    ]);
    if (sesi.error) return petakanErrorDb(sesi.error);
    if (anggota.error) return petakanErrorDb(anggota.error);

    const idSiswa = anggota.data.map((a) => a.siswa_id as string);
    let siswa: { id: string; nama: string }[] = [];
    if (idSiswa.length > 0) {
      const r = await db.from('pengguna').select('id, nama').in('id', idSiswa);
      if (r.error) return petakanErrorDb(r.error);
      siswa = r.data as { id: string; nama: string }[];
    }

    const idSesi = sesi.data.map((s) => s.id as string);
    let hasil: { sesi_id: string; siswa_id: string; skor: number; kelompok: string }[] = [];
    if (idSesi.length > 0) {
      const r = await db.from('hasil_siswa').select('sesi_id, siswa_id, skor, kelompok').in('sesi_id', idSesi);
      if (r.error) return petakanErrorDb(r.error);
      hasil = r.data as { sesi_id: string; siswa_id: string; skor: number; kelompok: string }[];
    }

    return responsOk(
      hitungPendampingan({
        sesi: sesi.data.map((s) => ({ id: s.id, status: s.status as StatusSesi, dibuatPada: s.dibuat_pada })),
        hasil: hasil.map((h) => ({
          sesiId: h.sesi_id,
          siswaId: h.siswa_id,
          skor: h.skor,
          kelompok: h.kelompok as Kelompok,
        })),
        siswa,
      }),
    );
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
