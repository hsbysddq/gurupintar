import { cocokKodeUndangan } from '@/lib/auth';
import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { skemaBodyDaftarGuru } from '@/lib/skema-api';
import { buatAkun, GalatAuth, masukDenganSandi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

const PESAN_UNDANGAN_TIDAK_VALID = 'Kode undangan guru tidak valid.';
const PESAN_PENDAFTARAN_TUTUP = 'Pendaftaran guru belum dibuka. Hubungi pengelola sekolah.';
const PESAN_KELAS_GAGAL = 'Akun belum berhasil dibuat. Coba lagi sebentar.';

// POST /api/auth/daftar-guru: wajib kode undangan server agar siswa tidak bisa mendaftar sebagai guru.
export async function POST(request: Request) {
  const input = skemaBodyDaftarGuru.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  const kodeUndangan = process.env.KODE_UNDANGAN_GURU;
  if (!kodeUndangan) return responsError(PESAN_PENDAFTARAN_TUTUP, 503);
  if (!cocokKodeUndangan(input.data.kodeUndangan, kodeUndangan)) {
    return responsError(PESAN_UNDANGAN_TIDAK_VALID, 403);
  }

  const { nama, email, password, namaKelas, mapel } = input.data;

  try {
    const db = ambilSupabase();
    const guruId = await buatAkun(nama, email, password, 'guru');

    const hasilKode = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      const { error } = await db.from('kelas').insert({
        guru_id: guruId,
        nama: namaKelas ?? 'Kelas Saya',
        mapel: mapel ?? 'Matematika',
        kode_undangan: kode,
      });
      if (!error) return { status: 'berhasil', nilai: kode };
      return adalahBentrokKode(error) ? { status: 'bentrok' } : { status: 'gagal', error };
    });

    if (hasilKode.status !== 'berhasil') {
      await db.auth.admin.deleteUser(guruId);
      return responsError(PESAN_KELAS_GAGAL, 500);
    }

    const profil = await masukDenganSandi(email, password);
    if (!profil) {
      return responsOk({ peran: 'guru', kodeKelas: hasilKode.kode, perluMasuk: true }, 201);
    }

    return responsOk({ peran: profil.peran, kodeKelas: hasilKode.kode }, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Pendaftaran guru gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
