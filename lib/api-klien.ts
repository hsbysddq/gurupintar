// Fungsi fetch untuk halaman (browser). Tidak boleh mengimpor dari lib/server.
import type { BodyJawaban } from './skema-api';
import type { Format, SesiUntukSiswa, SoalUntukSiswa } from './tipe';

export const PESAN_GAGAL_KONEKSI = 'Koneksi terputus. Periksa internet, lalu coba lagi.';
const PESAN_GAGAL_UMUM = 'Terjadi kesalahan. Coba lagi sebentar.';

/** Error dari API. `status` 0 berarti permintaan tidak sampai ke server. */
export class ErrorApi extends Error {
  readonly status: number;

  constructor(status: number, pesan: string) {
    super(pesan);
    this.name = 'ErrorApi';
    this.status = status;
  }
}

async function minta<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ErrorApi(0, PESAN_GAGAL_KONEKSI);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const pesan =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : PESAN_GAGAL_UMUM;
    throw new ErrorApi(res.status, pesan);
  }
  return data as T;
}

export function ambilSesi(kode: string): Promise<SesiUntukSiswa> {
  return minta(`/api/sesi?kode=${encodeURIComponent(kode)}`);
}

export function ambilSoal(sesiId: string): Promise<SoalUntukSiswa[]> {
  return minta(`/api/soal?sesi=${encodeURIComponent(sesiId)}`);
}

export function kirimFormat(siswaId: string, format: Format): Promise<{ ok: true }> {
  return minta('/api/siswa/format', { method: 'POST', body: JSON.stringify({ siswaId, format }) });
}

export function kirimJawaban(body: BodyJawaban): Promise<{ ok: true }> {
  return minta('/api/jawaban', { method: 'POST', body: JSON.stringify(body) });
}
