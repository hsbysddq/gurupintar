import { UKURAN_PDF_MAKS_BYTE } from '@/lib/konstanta';
import { skemaBodyUbahModulPdf } from '@/lib/skema-api';
import { wajibPeranApi } from '@/lib/server/auth';
import { buatMateriDariPdf, ErrorMateriAi } from '@/lib/server/materi-ai';
import { bacaBodyJson, PESAN_ERROR_UMUM, responsError, responsOk } from '@/lib/server/respons';

export const maxDuration = 70;

const PESAN_PDF_TIDAK_VALID = 'File harus berupa PDF dengan ukuran maksimal 5 MB.';
const PESAN_GAGAL_DIBUAT = 'Materi belum berhasil dibuat.';

// POST /api/guru/modul/pdf. PDF tidak disimpan di server; hasilnya bisa disimpan lewat API pustaka.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyUbahModulPdf.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_PDF_TIDAK_VALID, 400);

  // Periksa isi sebenarnya: tanda "%PDF-" di awal file dan ukuran setelah didekode.
  const biner = Buffer.from(input.data.pdf, 'base64');
  if (biner.length === 0 || biner.length > UKURAN_PDF_MAKS_BYTE || biner.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return responsError(PESAN_PDF_TIDAK_VALID, 400);
  }

  try {
    const isi = await buatMateriDariPdf(input.data.pdf);
    return responsOk({ isi, sumber: 'ai' });
  } catch (err) {
    // Isi PDF tidak dicatat di log.
    if (err instanceof ErrorMateriAi) {
      console.error('Pembuatan materi dari PDF gagal:', err.message);
      return responsError(PESAN_GAGAL_DIBUAT, 502);
    }
    console.error('Error tak terduga di /api/guru/modul/pdf:', err instanceof Error ? err.message : err);
    return responsError(PESAN_ERROR_UMUM, 500);
  }
}
