import 'server-only';

export const PESAN_SESI_TIDAK_ADA = 'Sesi kuis tidak ditemukan.';
export const PESAN_SESI_DITUTUP = 'Kuis ini sudah ditutup.';
export const PESAN_ERROR_UMUM = 'Terjadi kesalahan di server. Coba lagi sebentar.';
export const PESAN_INPUT_TIDAK_VALID = 'Data yang dikirim tidak valid.';

/** Membaca body JSON; mengembalikan `undefined` jika body kosong atau bukan JSON. */
export async function bacaBodyJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function responsOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/** Semua error API berbentuk `{ error: "<pesan bahasa Indonesia>" }` (architecture.md bagian 6). */
export function responsError(pesan: string, status: number): Response {
  return Response.json({ error: pesan }, { status });
}

/** Memetakan error dari Supabase/fungsi SQL (misalnya `raise exception` di simpan_hasil) ke respons API. */
export function petakanErrorDb(err: unknown): Response {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '';

  if (pesan.includes('SESI_TIDAK_ADA')) return responsError(PESAN_SESI_TIDAK_ADA, 404);
  if (pesan.includes('SESI_DITUTUP')) return responsError(PESAN_SESI_DITUTUP, 409);
  return responsError(PESAN_ERROR_UMUM, 500);
}
