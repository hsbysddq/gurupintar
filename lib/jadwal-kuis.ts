import type { StatusSesi } from './tipe';

export interface JadwalKuis {
  bukaPada: string | null;
  tutupPada: string | null;
}

export const JADWAL_KOSONG: JadwalKuis = { bukaPada: null, tutupPada: null };

export type HasilValidasiJadwal =
  | { ok: true; jadwal: JadwalKuis }
  | { ok: false; pesan: string; kolom: 'bukaPada' | 'tutupPada' };

function waktuValid(nilai: string | null): number | null {
  if (!nilai) return null;
  const waktu = Date.parse(nilai);
  return Number.isFinite(waktu) ? waktu : null;
}

/**
 * Status sesi yang dilihat siswa/guru. `status` di database hanya aktif/selesai; jadwal membuat
 * sesi bisa tampil sebagai "terjadwal" sebelum waktu buka dan "selesai" setelah waktu tutup.
 */
export function statusSesiEfektif(
  status: 'aktif' | 'selesai',
  jadwal: Partial<JadwalKuis> = JADWAL_KOSONG,
  sekarang: Date = new Date(),
): StatusSesi {
  if (status === 'selesai') return 'selesai';

  const buka = waktuValid(jadwal.bukaPada ?? null);
  if (buka !== null && sekarang.getTime() < buka) return 'terjadwal';

  const tutup = waktuValid(jadwal.tutupPada ?? null);
  if (tutup !== null && sekarang.getTime() >= tutup) return 'selesai';

  return 'aktif';
}

/** Nilai `datetime-local` ditafsirkan sebagai waktu lokal browser. Null bila kosong/tidak valid. */
export function waktuLokalKeIso(nilai: string): string | null {
  if (!nilai.trim()) return null;
  const waktu = new Date(nilai);
  return Number.isNaN(waktu.getTime()) ? null : waktu.toISOString();
}

/** ISO 8601 menjadi nilai untuk `<input type="datetime-local">` menurut waktu lokal browser. */
export function isoKeNilaiLokal(iso: string | null): string {
  if (!iso) return '';
  const waktu = new Date(iso);
  if (Number.isNaN(waktu.getTime())) return '';
  const dua = (angka: number) => String(angka).padStart(2, '0');
  return `${waktu.getFullYear()}-${dua(waktu.getMonth() + 1)}-${dua(waktu.getDate())}T${dua(waktu.getHours())}:${dua(waktu.getMinutes())}`;
}

export function formatJadwal(iso: string | null): string {
  if (!iso) return '—';
  const waktu = new Date(iso);
  if (Number.isNaN(waktu.getTime())) return '—';
  return waktu.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function validasiJadwalIso(
  bukaPada: string | null,
  tutupPada: string | null,
  sekarang: Date = new Date(),
): HasilValidasiJadwal {
  const buka = waktuValid(bukaPada);
  if (bukaPada && buka === null) {
    return { ok: false, pesan: 'Waktu buka belum valid.', kolom: 'bukaPada' };
  }

  const tutup = waktuValid(tutupPada);
  if (tutupPada && tutup === null) {
    return { ok: false, pesan: 'Waktu tutup belum valid.', kolom: 'tutupPada' };
  }

  const bukaEfektif = buka ?? sekarang.getTime();
  if (tutup !== null && tutup <= bukaEfektif) {
    return { ok: false, pesan: 'Waktu tutup harus setelah waktu buka.', kolom: 'tutupPada' };
  }
  if (tutup !== null && tutup <= sekarang.getTime()) {
    return { ok: false, pesan: 'Waktu tutup sudah lewat. Pilih waktu setelah sekarang.', kolom: 'tutupPada' };
  }

  return {
    ok: true,
    jadwal: {
      bukaPada: buka === null ? null : new Date(buka).toISOString(),
      tutupPada: tutup === null ? null : new Date(tutup).toISOString(),
    },
  };
}

/** Ringkasan satu baris untuk kartu guru. */
export function ringkasJadwal(jadwal: Partial<JadwalKuis>, sekarang: Date = new Date()): string {
  const status = statusSesiEfektif('aktif', jadwal, sekarang);
  if (status === 'terjadwal') {
    const tutup = jadwal.tutupPada ? ` · tutup ${formatJadwal(jadwal.tutupPada)}` : '';
    return `Terbuka otomatis ${formatJadwal(jadwal.bukaPada ?? null)}${tutup}`;
  }
  if (status === 'selesai' && jadwal.tutupPada) return `Ditutup otomatis ${formatJadwal(jadwal.tutupPada)}`;
  if (jadwal.tutupPada) return `Ditutup otomatis ${formatJadwal(jadwal.tutupPada)}`;
  return 'Dibuka sekarang · ditutup manual';
}
