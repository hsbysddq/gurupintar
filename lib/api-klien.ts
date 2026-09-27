// Fungsi fetch untuk halaman (browser). Tidak boleh mengimpor dari lib/server.
import type { BodyBuatMateri, BodyJawaban } from './skema-api';
import type {
  Format,
  HasilGuru,
  IsiMateri,
  MateriGuru,
  MateriSiswa,
  SesiBaru,
  SesiGuru,
  SesiUntukSiswa,
  SoalUntukSiswa,
} from './tipe';

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
  } catch (err) {
    // Pembatalan lewat AbortController (usePolling) bukan gangguan koneksi.
    if (init?.signal?.aborted) throw err;
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

export function ambilMateriSiswa(sesiId: string, siswaId: string, signal?: AbortSignal): Promise<MateriSiswa> {
  return minta(`/api/materi?sesi=${encodeURIComponent(sesiId)}&siswa=${encodeURIComponent(siswaId)}`, { signal });
}

// ===== Guru =====

export function ambilDaftarSesi(signal?: AbortSignal): Promise<SesiGuru[]> {
  return minta('/api/guru/sesi', { signal });
}

export function bukaSesi(): Promise<SesiBaru> {
  return minta('/api/guru/sesi', { method: 'POST', body: JSON.stringify({}) });
}

export function tutupSesi(sesiId: string): Promise<{ ok: true }> {
  return minta('/api/guru/sesi/tutup', { method: 'POST', body: JSON.stringify({ sesiId }) });
}

export function ambilHasil(sesiId: string, signal?: AbortSignal): Promise<HasilGuru> {
  return minta(`/api/guru/hasil?sesi=${encodeURIComponent(sesiId)}`, { signal });
}

export function ambilMateriGuru(sesiId: string, signal?: AbortSignal): Promise<MateriGuru[]> {
  return minta(`/api/guru/materi?sesi=${encodeURIComponent(sesiId)}`, { signal });
}

export function buatMateri(body: BodyBuatMateri): Promise<MateriGuru[]> {
  return minta('/api/guru/materi', { method: 'POST', body: JSON.stringify(body) });
}

export function ubahMateri(id: string, versi: number, isi: IsiMateri): Promise<{ ok: true; versi: number }> {
  return minta('/api/guru/materi', { method: 'PATCH', body: JSON.stringify({ id, versi, isi }) });
}

export function bagikanMateri(sesiId: string): Promise<{ ok: true; jumlahDibagikan: number }> {
  return minta('/api/guru/materi/bagikan', { method: 'POST', body: JSON.stringify({ sesiId }) });
}
