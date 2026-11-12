import { skemaBodyUjianBaru } from '@/lib/skema-api';
import { GalatAuth, wajibPeranApi, wajibSekolah } from '@/lib/server/auth';
import { buatUjian, daftarUjianGuru } from '@/lib/server/ujian';
import {
  bacaBodyJson,
  PESAN_ERROR_UMUM,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import { validasiJadwalIso } from '@/lib/jadwal-kuis';

export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;
  try {
    return responsOk(await daftarUjianGuru(auth.profil.id, wajibSekolah(auth.profil)));
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Daftar ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}

export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;
  const input = skemaBodyUjianBaru.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  const jadwal = validasiJadwalIso(input.data.mulaiPada, input.data.selesaiPada);
  if (!jadwal.ok) return responsError(jadwal.pesan, 400);
  if (!jadwal.jadwal.bukaPada || !jadwal.jadwal.tutupPada) return responsError('Jendela ujian wajib diisi.', 400);

  try {
    const ujian = await buatUjian(auth.profil.id, wajibSekolah(auth.profil), {
      ...input.data,
      mulaiPada: jadwal.jadwal.bukaPada,
      selesaiPada: jadwal.jadwal.tutupPada,
    });
    return responsOk(ujian, 201);
  } catch (err) {
    if (err instanceof GalatAuth) return responsError(err.message, err.status);
    console.error('Buat ujian gagal:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
