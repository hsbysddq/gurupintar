import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { skemaBodyBuatKelas, skemaBodyUbahKelas, skemaQueryKelasSiswa } from '@/lib/skema-api';
import { kelasMilikGuru, kolomArsipBelumAda, wajibPeranApi } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { KelasRingkas } from '@/lib/tipe';

const PESAN_KODE_GAGAL = 'Kode undangan kelas belum berhasil dibuat. Coba lagi.';
const PESAN_KELAS_TIDAK_ADA = 'Kelas tidak ditemukan.';

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

    // Kolom warna/foto hanya diperlukan bila guru mengisinya. Tanpa migrasi,
    // pembuatan kelas biasa tetap berjalan.
    const adaTampilan = Boolean(input.data.warna || input.data.sampul);
    if (adaTampilan) {
      const cek = await db.from('kelas').select('warna, sampul').limit(1);
      if (cek.error) {
        return responsError(
          'Fitur warna/foto kelas belum aktif. Jalankan supabase/migrasi-sampul-kelas.sql di Supabase.',
          503,
        );
      }
    }

    const isian: Record<string, unknown> = {
      guru_id: auth.profil.id,
      nama: input.data.nama,
      mapel: input.data.mapel,
      kode_undangan: '',
    };

    const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      const { data, error } = await db
        .from('kelas')
        .insert({
          ...isian,
          kode_undangan: kode,
          ...(input.data.warna ? { warna: input.data.warna } : {}),
          ...(input.data.sampul ? { sampul: input.data.sampul } : {}),
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
      warna: input.data.warna ?? null,
      sampul: input.data.sampul ?? null,
      kuisAktif: null,
    };
    return responsOk(respons, 201);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// PATCH /api/guru/kelas: ubah nama/mapel, arsipkan, atau pulihkan kelas.
export async function PATCH(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyUbahKelas.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { id, nama, mapel, arsip } = input.data;

  try {
    const db = ambilSupabase();
    if (!(await kelasMilikGuru(db, auth.profil.id, id, { termasukArsip: true }))) {
      return responsError(PESAN_KELAS_TIDAK_ADA, 404);
    }

    // Beri pesan jelas jika kolom arsip belum dibuat, sebelum menutup kuis aktif.
    if (arsip !== undefined) {
      const cek = await db.from('kelas').select('diarsipkan_pada').eq('id', id).maybeSingle();
      if (cek.error && kolomArsipBelumAda(cek.error)) {
        return responsError(
          'Fitur arsip belum aktif. Jalankan supabase/migrasi-arsip-kelas.sql di Supabase.',
          503,
        );
      }
      if (cek.error) return petakanErrorDb(cek.error);
    }

    // Kelas yang diarsipkan tidak boleh menyisakan kuis aktif.
    if (arsip === true) {
      const sesi = await db
        .from('sesi_kuis')
        .update({ status: 'selesai' })
        .eq('kelas_id', id)
        .eq('status', 'aktif');
      if (sesi.error) return petakanErrorDb(sesi.error);
    }

    const perubahan: Record<string, unknown> = {};
    if (nama !== undefined) perubahan.nama = nama;
    if (mapel !== undefined) perubahan.mapel = mapel;
    if (arsip !== undefined) perubahan.diarsipkan_pada = arsip ? new Date().toISOString() : null;

    const { error } = await db.from('kelas').update(perubahan).eq('id', id).eq('guru_id', auth.profil.id);
    if (error) return petakanErrorDb(error);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// DELETE /api/guru/kelas?kelas=: hapus kelas milik guru secara permanen. Keanggotaan siswa, kuis, jawaban,
// hasil, dan materi kelas ikut terhapus lewat ON DELETE CASCADE di database. Topik dan soal tidak terhapus.
export async function DELETE(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const query = skemaQueryKelasSiswa.safeParse({ kelas: new URL(request.url).searchParams.get('kelas') });
  if (!query.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const id = query.data.kelas;

  try {
    const db = ambilSupabase();
    if (!(await kelasMilikGuru(db, auth.profil.id, id, { termasukArsip: true }))) {
      return responsError(PESAN_KELAS_TIDAK_ADA, 404);
    }

    const { error } = await db.from('kelas').delete().eq('id', id).eq('guru_id', auth.profil.id);
    if (error) return petakanErrorDb(error);

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
