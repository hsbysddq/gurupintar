import { ringkasStatusMateri } from './status-materi';
import type { Kelompok, RingkasanMateri, SiswaHasil, StatusMateri } from './tipe';

const URUTAN_KELOMPOK: Kelompok[] = ['sudah', 'setengah', 'belum'];

type HasilDenganKelompok = SiswaHasil & { kelompok: Kelompok };

/** Mengelompokkan hasil siswa ke tiga kelompok, nama urut abjad (AC-5.3). */
export function kelompokkanHasil(hasil: HasilDenganKelompok[]): Record<Kelompok, SiswaHasil[]> {
  const kelompok: Record<Kelompok, SiswaHasil[]> = { sudah: [], setengah: [], belum: [] };
  for (const { kelompok: k, siswaId, nama, skor, total } of hasil) {
    kelompok[k].push({ siswaId, nama, skor, total });
  }
  for (const k of URUTAN_KELOMPOK) {
    kelompok[k].sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
  }
  return kelompok;
}

/** Status materi sesi dan kelompok berisi siswa yang belum punya materi (architecture.md 6.1, AC-5.7). */
export function ringkasMateri(
  kelompok: Record<Kelompok, SiswaHasil[]>,
  materi: { kelompok: Kelompok; status: StatusMateri }[],
): RingkasanMateri {
  const statusMateri = ringkasStatusMateri(materi);

  const punyaMateri = new Set(materi.map((m) => m.kelompok));
  const kelompokTanpaMateri = URUTAN_KELOMPOK.filter((k) => kelompok[k].length > 0 && !punyaMateri.has(k));

  return { statusMateri, kelompokTanpaMateri };
}

/**
 * Pesan KartuSoalTersulit saat soal tersulit tidak bisa dihitung (design.md 4.10).
 * Ada siswa yang menjawab tetapi tanpa data jawaban per soal (misalnya data riwayat) → pesan rincian.
 */
export function pesanTanpaSoalTersulit(jumlahMenjawab: number): string {
  return jumlahMenjawab > 0
    ? 'Rincian jawaban per soal tidak tersedia untuk kuis ini.'
    : 'Belum ada jawaban masuk.';
}
