import { KOIN_PER_MODUL, PANJANG_MODUL_MAKS, PANJANG_MODUL_MIN } from '@/lib/konstanta';
import { skemaBodyUbahModul } from '@/lib/skema-api';
import { pastikanModelAi } from '@/lib/server/ai-provider';
import { wajibPeranApi } from '@/lib/server/auth';
import {
  PESAN_KOIN_HABIS,
  PESAN_MIGRASI_KOIN,
  potongKoin,
  tambahKoin,
} from '@/lib/server/koin';
import { buatMateriDariModul, ErrorMateriAi } from '@/lib/server/materi-ai';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';

// Sedikit di atas BATAS_WAKTU_AI_MS (60 detik) agar API sempat membalas 502 (architecture.md 9.1).
export const maxDuration = 70;

const PESAN_PANJANG_MODUL = `Teks modul harus ${PANJANG_MODUL_MIN}–${PANJANG_MODUL_MAKS} karakter.`;
const PESAN_MODEL_TIDAK_VALID = 'Model AI yang dipilih tidak tersedia. Muat ulang halaman lalu pilih lagi.';
const PESAN_GAGAL_DIBUAT = 'Materi belum berhasil dibuat.';

// POST /api/guru/modul (PRD F-9). Menghasilkan isi materi; penyimpanan ke pustaka dilakukan lewat API terpisah.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyUbahModul.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_PANJANG_MODUL, 400);

  if (input.data.model && !(await pastikanModelAi(input.data.model))) {
    return responsError(PESAN_MODEL_TIDAK_VALID, 400);
  }

  try {
    const db = ambilSupabase();
    const potong = await potongKoin(db, auth.profil.id, KOIN_PER_MODUL, 'Ubah modul dari teks');
    if (!potong.ok) {
      if (potong.alasan === 'kurang') return responsError(PESAN_KOIN_HABIS, 402);
      if (potong.alasan === 'migrasi') {
        console.error('Migrasi koin belum dijalankan:', potong.error);
        return responsError(PESAN_MIGRASI_KOIN, 503);
      }
      return petakanErrorDb(potong.error);
    }

    try {
      const isi = await buatMateriDariModul(input.data.teks, {
        model: input.data.model,
        fokus: input.data.fokus,
        format: input.data.format,
        gayaPpt: input.data.gaya_ppt,
        gayaAudio: input.data.gaya_audio,
      });
      return responsOk({ isi, sumber: 'ai', koin: potong.sisa });
    } catch (err) {
      // AI gagal: kembalikan koin agar guru tidak dirugikan.
      const refund = await tambahKoin(
        db,
        auth.profil.id,
        KOIN_PER_MODUL,
        'refund',
        'Refund karena pembuatan materi gagal',
      );
      if (!refund.ok) console.error('Refund koin gagal:', refund.error);

      // Isi teks modul tidak dicatat di log.
      if (err instanceof ErrorMateriAi) {
        console.error('Pembuatan materi dari modul gagal:', err.message);
        const alasan = err.message.replace(/^Materi .* gagal dibuat:\s*/, '').trim();
        return responsError(alasan || PESAN_GAGAL_DIBUAT, 502);
      }
      console.error('Error tak terduga di /api/guru/modul:', err instanceof Error ? err.message : err);
      return responsError(PESAN_ERROR_UMUM, 500);
    }
  } catch (err) {
    console.error('Error /api/guru/modul:', err instanceof Error ? err.message : err);
    return petakanErrorDb(err);
  }
}
