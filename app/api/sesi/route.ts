import type { NextRequest } from 'next/server';
import { skemaBodyGabungSesi } from '@/lib/skema-api';
import { PESAN_NAMA_DIPAKAI, tambahAnggotaKelas } from '@/lib/server/anggota';
import { wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_DITUTUP,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { SesiUntukSiswa, StatusSesi } from '@/lib/tipe';

const PESAN_KODE_TIDAK_DITEMUKAN = 'Kode kelas tidak ditemukan. Periksa lagi kode dari gurumu.';

// POST /api/sesi: siswa login memasukkan kode kuis. Server mendaftarkannya ke kelas bila belum.
export async function POST(request: NextRequest) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyGabungSesi.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const { data: sesi, error } = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, kelas_id, topik_id')
      .eq('kode_kelas', input.data.kode)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!sesi) return responsError(PESAN_KODE_TIDAK_DITEMUKAN, 404);
    if (sesi.status !== 'aktif') return responsError(PESAN_SESI_DITUTUP, 409);

    const [kelas, topik, anggota] = await Promise.all([
      db.from('kelas').select('nama').eq('id', sesi.kelas_id).single(),
      db.from('topik').select('nama').eq('id', sesi.topik_id).single(),
      db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', sesi.kelas_id).eq('siswa_id', auth.profil.id).maybeSingle(),
    ]);
    if (kelas.error) return petakanErrorDb(kelas.error);
    if (topik.error) return petakanErrorDb(topik.error);
    if (anggota.error) return petakanErrorDb(anggota.error);

    if (!anggota.data) {
      const tambah = await tambahAnggotaKelas(db, sesi.kelas_id, auth.profil.id, auth.profil.nama);
      if (!tambah.ok) {
        if (tambah.konflikNama) return responsError(PESAN_NAMA_DIPAKAI, 409);
        return petakanErrorDb(tambah.error);
      }
    }

    const respons: SesiUntukSiswa = {
      sesi: {
        id: sesi.id,
        kodeKelas: sesi.kode_kelas,
        status: sesi.status as StatusSesi,
        kelasId: sesi.kelas_id,
        namaKelas: kelas.data.nama,
        namaTopik: topik.data.nama,
      },
    };
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// Sesi tidak pernah dibaca lewat GET agar daftar siswa dan kode tidak bisa diintip tanpa login.
