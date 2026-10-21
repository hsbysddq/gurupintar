import { PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN } from '@/lib/konstanta';
import { skemaBodyUbahModul } from '@/lib/skema-api';
import { wajibPeranApi } from '@/lib/server/auth';
import { buatMateriDariModul, ErrorMateriAi } from '@/lib/server/materi-ai';
import { bacaBodyJson, PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';

// Sedikit di atas BATAS_WAKTU_AI_MS (60 detik) agar API sempat membalas 502 (architecture.md 9.1).
export const maxDuration = 70;

const PESAN_PANJANG_MODUL = `Teks modul harus ${PANJANG_MODUL_MIN}–${PANJANG_MODUL_MAKS} karakter.`;
const PESAN_GAGAL_DIBUAT = 'Materi belum berhasil dibuat.';

// POST /api/guru/modul (PRD F-9). Hanya pratinjau: tidak ada yang disimpan ke database.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyUbahModul.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_PANJANG_MODUL, 400);

  try {
    const isi = await buatMateriDariModul(input.data.teks);
    return responsOk({ isi });
  } catch (err) {
    // Isi teks modul tidak dicatat di log.
    if (err instanceof ErrorMateriAi) {
      console.error('Pembuatan materi dari modul gagal:', err.message);
      return responsError(PESAN_GAGAL_DIBUAT, 502);
    }
    console.error('Error tak terduga di /api/guru/modul:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
