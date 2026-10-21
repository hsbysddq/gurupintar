import { skemaBodyDaftarSiswa } from '@/lib/skema-api';
import { buatAkun, GalatAuth, kelasDariKode, masukDenganSandi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, PESAN_ERROR_UMUM, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';

const PESAN_KODE_KELAS = 'Kode kelas tidak ditemukan. Periksa lagi kode dari gurumu.';
const PESAN_DAFTAR_GAGAL = 'Akun belum berhasil dibuat. Coba lagi sebentar.';

// POST /api/auth/daftar-siswa: peran ditetapkan server; kode kelas opsional untuk langsung bergabung.
export async function POST(request: Request) {
  const input = skemaBodyDaftarSiswa.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { nama, email, password, kodeKelas } = input.data;

  try {
    const db = ambilSupabase();
    const kelasId = kodeKelas ? await kelasDariKode(db, kodeKelas) : null;
    if (kodeKelas && !kelasId) return responsError(PESAN_KODE_KELAS, 404);

    const siswaId = await buatAkun(nama, email, password, 'siswa');

    if (kelasId) {
      const { error } = await db.from('keanggotaan_kelas').insert({ kelas_id: kelasId, siswa_id: siswaId });
      if (error) {
        await db.auth.admin.deleteUser(siswaId);
        return responsError(PESAN_DAFTAR_GAGAL, 500);
      }
    }

    const profil = await masukDenganSandi(email, password);
    if (!profil) {
      return responsOk({ peran: 'siswa', punyaKelas: Boolean(kelasId), perluMasuk: true }, 201);
    }

    return responsOk({ peran: profil.peran, punyaKelas: Boolean(kelasId) }, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Pendaftaran siswa gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
