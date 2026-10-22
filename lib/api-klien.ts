// Fungsi fetch untuk halaman (browser). Tidak boleh mengimpor dari lib/server.
import type {
  BodyBuatKelas,
  BodyBuatMateri,
  BodyBukaSesiBanyak,
  BodyDaftarGuru,
  BodyDaftarSiswa,
  BodyJawaban,
  BodyMasuk,
  BodyTopikBaru,
  BodyUbahKelas,
} from './skema-api';
import type {
  DataPendampingan,
  Format,
  HasilGuru,
  IsiMateri,
  KelasRingkas,
  MateriGuru,
  MateriSiswa,
  Peran,
  SesiBaru,
  SesiBanyakBaru,
  SesiGuru,
  SesiUntukSiswa,
  SoalUntukSiswa,
  TopikRingkas,
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
      credentials: 'same-origin',
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

// ===== Autentikasi =====

export interface HasilDaftar {
  peran: Peran;
  punyaKelas?: boolean;
  kodeKelas?: string;
  perluMasuk?: boolean;
}

export function masuk(body: BodyMasuk): Promise<{ peran: Peran }> {
  return minta('/api/auth/masuk', { method: 'POST', body: JSON.stringify(body) });
}

export function daftarSiswa(body: BodyDaftarSiswa): Promise<HasilDaftar> {
  return minta('/api/auth/daftar-siswa', { method: 'POST', body: JSON.stringify(body) });
}

export function daftarGuru(body: BodyDaftarGuru): Promise<HasilDaftar> {
  return minta('/api/auth/daftar-guru', { method: 'POST', body: JSON.stringify(body) });
}

export function keluar(): Promise<{ ok: true }> {
  return minta('/api/auth/keluar', { method: 'POST' });
}

// ===== Siswa =====

/** Bergabung ke kuis dengan kode; server juga mendaftarkan siswa ke kelas bila belum. */
export function gabungSesi(kode: string): Promise<SesiUntukSiswa> {
  return minta('/api/sesi', { method: 'POST', body: JSON.stringify({ kode }) });
}

export function ambilSoal(sesiId: string): Promise<SoalUntukSiswa[]> {
  return minta(`/api/soal?sesi=${encodeURIComponent(sesiId)}`);
}

export function kirimFormat(sesiId: string, format: Format): Promise<{ ok: true }> {
  return minta('/api/siswa/format', { method: 'POST', body: JSON.stringify({ sesiId, format }) });
}

export function kirimJawaban(body: BodyJawaban): Promise<{ ok: true }> {
  return minta('/api/jawaban', { method: 'POST', body: JSON.stringify(body) });
}

export function ambilMateriSiswa(sesiId: string, signal?: AbortSignal): Promise<MateriSiswa> {
  return minta(`/api/materi?sesi=${encodeURIComponent(sesiId)}`, { signal });
}

// ===== Guru =====

export function ambilDaftarKelas(): Promise<KelasRingkas[]> {
  return minta('/api/guru/kelas');
}

export function buatKelas(body: BodyBuatKelas): Promise<KelasRingkas> {
  return minta('/api/guru/kelas', { method: 'POST', body: JSON.stringify(body) });
}

export function ubahKelas(body: BodyUbahKelas): Promise<{ ok: true }> {
  return minta('/api/guru/kelas', { method: 'PATCH', body: JSON.stringify(body) });
}

export function ambilDaftarSesi(kelasId?: string, signal?: AbortSignal): Promise<SesiGuru[]> {
  const query = kelasId ? `?kelas=${encodeURIComponent(kelasId)}` : '';
  return minta(`/api/guru/sesi${query}`, { signal });
}

/** Tanpa `topikId`, server memakai topik demo; tanpa `kelasId`, kelas pertama milik guru. */
export function bukaSesi(input: { kelasId?: string; topikId?: string } = {}): Promise<SesiBaru> {
  return minta('/api/guru/sesi', { method: 'POST', body: JSON.stringify(input) });
}

/** Buka satu topik untuk beberapa kelas sekaligus. */
export function bukaSesiBanyak(body: BodyBukaSesiBanyak): Promise<SesiBanyakBaru> {
  return minta('/api/guru/sesi/banyak', { method: 'POST', body: JSON.stringify(body) });
}

export function ambilDaftarTopik(): Promise<TopikRingkas[]> {
  return minta('/api/guru/topik');
}

export function simpanTopik(body: BodyTopikBaru): Promise<TopikRingkas> {
  return minta('/api/guru/topik', { method: 'POST', body: JSON.stringify(body) });
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

export function ubahModul(teks: string): Promise<{ isi: IsiMateri }> {
  return minta('/api/guru/modul', { method: 'POST', body: JSON.stringify({ teks }) });
}

export function ambilPendampingan(kelasId?: string, signal?: AbortSignal): Promise<DataPendampingan> {
  const query = kelasId ? `?kelas=${encodeURIComponent(kelasId)}` : '';
  return minta(`/api/guru/pendampingan${query}`, { signal });
}
