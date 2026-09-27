import 'server-only';
import dataCadangan from '@/data/materi-cadangan.json';
import type { Kelompok } from '@/lib/tipe';
import { periksaIsiMateri, type IsiMateri } from '@/lib/validasi-materi';

// Materi yang ditulis manual oleh tim (architecture.md 9.5), dipakai saat guru memilih "Gunakan materi cadangan".
export function ambilMateriCadangan(kelompok: Kelompok): IsiMateri {
  const hasil = periksaIsiMateri(dataCadangan[kelompok]);
  if (!hasil.ok) throw new Error(`data/materi-cadangan.json (${kelompok}) tidak valid: ${hasil.alasan}`);
  return hasil.isi;
}
