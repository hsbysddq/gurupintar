import type { Kelompok, StatusMateri } from './tipe';

const URUTAN_KELOMPOK: Kelompok[] = ['belum', 'setengah', 'sudah'];

export const PESAN_BELUM_ADA_JAWABAN = 'Belum ada siswa yang menjawab. Materi bisa dibuat setelah ada jawaban masuk.';
export const PESAN_SUDAH_DIBAGIKAN = 'Materi yang sudah dibagikan tidak bisa dibuat ulang.';

export type HasilTargetMateri =
  | { ok: true; target: Kelompok[] }
  | { ok: false; status: 400 | 409; pesan: string };

/** Kelompok target pembuatan materi (architecture.md 7.3). Target kosong berarti tidak perlu memanggil AI. */
export function tentukanTargetMateri(input: {
  jumlahPerKelompok: Record<Kelompok, number>;
  materi: { kelompok: Kelompok; status: StatusMateri }[];
  ganti: boolean;
}): HasilTargetMateri {
  const berisiSiswa = URUTAN_KELOMPOK.filter((k) => input.jumlahPerKelompok[k] > 0);
  if (berisiSiswa.length === 0) return { ok: false, status: 400, pesan: PESAN_BELUM_ADA_JAWABAN };

  if (input.ganti) {
    if (input.materi.some((m) => m.status === 'dibagikan')) {
      return { ok: false, status: 409, pesan: PESAN_SUDAH_DIBAGIKAN };
    }
    return { ok: true, target: berisiSiswa };
  }

  const punyaMateri = new Set(input.materi.map((m) => m.kelompok));
  return { ok: true, target: berisiSiswa.filter((k) => !punyaMateri.has(k)) };
}

function ekstrakTeksMiskonsepsi(peta: Record<string, string> | undefined, pilihan: string): string[] {
  if (!peta) return [];
  const langsung = peta[pilihan]?.trim();
  if (langsung) return [langsung];

  if (pilihan.includes(',')) {
    const daftar = pilihan
      .split(',')
      .map((kode) => peta[kode.trim()]?.trim() ?? '')
      .filter((t) => t.length > 0);
    if (daftar.length > 0) return daftar;
  }

  const umum = peta.umum?.trim();
  return umum ? [umum] : [];
}

/**
 * Teks miskonsepsi yang paling sering muncul di tiap kelompok, untuk pesan AI (architecture.md 9.2 dan 9.4).
 * Hanya teks miskonsepsi yang keluar dari fungsi ini; nama dan ID siswa tidak ikut.
 */
export function miskonsepsiPerKelompok(
  input: {
    hasil: { siswaId: string; kelompok: Kelompok }[];
    jawaban: { siswaId: string; soalId: string; pilihan: string; benar: boolean; belumDinilai?: boolean }[];
    soal: { id: string; miskonsepsi: Record<string, string> }[];
  },
  batas = 3,
): Record<Kelompok, string[]> {
  const kelompokSiswa = new Map(input.hasil.map((h) => [h.siswaId, h.kelompok]));
  const miskonsepsiSoal = new Map(input.soal.map((s) => [s.id, s.miskonsepsi]));
  const hitungan: Record<Kelompok, Map<string, number>> = { sudah: new Map(), setengah: new Map(), belum: new Map() };

  for (const j of input.jawaban) {
    if (j.benar || j.belumDinilai) continue;
    const kelompok = kelompokSiswa.get(j.siswaId);
    if (!kelompok) continue;
    for (const teks of ekstrakTeksMiskonsepsi(miskonsepsiSoal.get(j.soalId), j.pilihan)) {
      hitungan[kelompok].set(teks, (hitungan[kelompok].get(teks) ?? 0) + 1);
    }
  }

  const urutkan = (peta: Map<string, number>) =>
    [...peta.entries()]
      .sort(([teksA, a], [teksB, b]) => b - a || teksA.localeCompare(teksB, 'id'))
      .slice(0, batas)
      .map(([teks]) => teks);

  return { sudah: urutkan(hitungan.sudah), setengah: urutkan(hitungan.setengah), belum: urutkan(hitungan.belum) };
}
