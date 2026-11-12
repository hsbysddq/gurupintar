import type { StatusUjian, TipeSoalUjian } from './tipe';
import { normalisasiPilganKompleks, periksaDanNilaiJawaban } from './soal-tka';

export const DURASI_UJIAN_MIN = 5;
export const DURASI_UJIAN_MAKS = 300;
export const BOBOT_UJIAN_MIN = 1;
export const BOBOT_UJIAN_MAKS = 100;
export const MAKS_PERCOBAAN_TOKEN = 5;

export type SoalUjianUntukNilai = {
  id: string;
  tipe: TipeSoalUjian;
  pilihan: unknown;
  kunci: string;
  bobot: number;
};

export type JawabanUjianUntukNilai = {
  soalId: string;
  jawaban: string;
  benar?: boolean | null;
  bobotDidapat?: number | null;
};

export type HasilNilaiUjian = {
  skor: number;
  total: number;
  persen: number;
  belumDinilai: number;
};

/** Token ujian: huruf/angka kapital, 6–10 karakter. */
export function normalisasiTokenUjian(nilai: string): string {
  return nilai.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
}

export function tokenUjianValid(nilai: string): boolean {
  return /^[A-Z0-9]{6,10}$/.test(normalisasiTokenUjian(nilai));
}

/** Status tampilan ujian berdasarkan status database dan jendela waktu. */
export function statusUjianEfektif(
  status: StatusUjian,
  mulaiPada: string | null,
  selesaiPada: string | null,
  sekarang: Date = new Date(),
): StatusUjian {
  if (status === 'draf' || status === 'selesai') return status;
  const mulai = mulaiPada ? Date.parse(mulaiPada) : NaN;
  const selesai = selesaiPada ? Date.parse(selesaiPada) : NaN;
  if (Number.isFinite(mulai) && sekarang.getTime() < mulai) return 'terjadwal';
  if (Number.isFinite(selesai) && sekarang.getTime() >= selesai) return 'selesai';
  return 'aktif';
}

/** Batas akhir peserta: durasi pribadi tidak boleh melewati jam tutup ujian. */
export function hitungBatasPeserta(
  mulaiPada: string,
  durasiMenit: number,
  selesaiUjian: string,
): string {
  const mulai = Date.parse(mulaiPada);
  const tutup = Date.parse(selesaiUjian);
  const batas = Math.min(mulai + durasiMenit * 60_000, tutup);
  return new Date(batas).toISOString();
}

export function sisaDetik(batasPada: string, sekarang: Date = new Date()): number {
  const batas = Date.parse(batasPada);
  if (!Number.isFinite(batas)) return 0;
  return Math.max(0, Math.ceil((batas - sekarang.getTime()) / 1000));
}

export function bobotUjianValid(nilai: unknown): nilai is number {
  return typeof nilai === 'number' && Number.isInteger(nilai) && nilai >= BOBOT_UJIAN_MIN && nilai <= BOBOT_UJIAN_MAKS;
}

/** Menilai jawaban objektif dan menyisakan esai untuk guru. */
export function nilaiSatuJawaban(
  soal: SoalUjianUntukNilai,
  jawaban: JawabanUjianUntukNilai | undefined,
): { benar: boolean | null; bobotDidapat: number; belumDinilai: boolean } {
  if (soal.tipe === 'esai') {
    if (!jawaban) return { benar: null, bobotDidapat: 0, belumDinilai: true };
    if (jawaban.benar === true) return { benar: true, bobotDidapat: soal.bobot, belumDinilai: false };
    if (jawaban.benar === false) return { benar: false, bobotDidapat: 0, belumDinilai: false };
    return { benar: null, bobotDidapat: 0, belumDinilai: true };
  }

  if (!jawaban || !jawaban.jawaban.trim()) return { benar: false, bobotDidapat: 0, belumDinilai: false };

  if (soal.tipe === 'pilgan_kompleks') {
    const dipilih = normalisasiPilganKompleks(jawaban.jawaban.split(','));
    const kunci = normalisasiPilganKompleks(soal.kunci.split(','));
    const benar = dipilih.length > 0 && dipilih === kunci;
    return { benar, bobotDidapat: benar ? soal.bobot : 0, belumDinilai: false };
  }

  const hasil = periksaDanNilaiJawaban(soal, jawaban.jawaban);
  return {
    benar: hasil.valid ? hasil.benar : false,
    bobotDidapat: hasil.valid && hasil.benar ? soal.bobot : 0,
    belumDinilai: false,
  };
}

export function hitungNilaiUjian(
  soal: readonly SoalUjianUntukNilai[],
  jawaban: readonly JawabanUjianUntukNilai[],
): HasilNilaiUjian {
  const peta = new Map(jawaban.map((j) => [j.soalId, j]));
  let skor = 0;
  let total = 0;
  let belumDinilai = 0;

  for (const s of soal) {
    total += s.bobot;
    const hasil = nilaiSatuJawaban(s, peta.get(s.id));
    skor += hasil.bobotDidapat;
    if (hasil.belumDinilai) belumDinilai += 1;
  }

  return {
    skor,
    total,
    persen: total > 0 ? Math.round((skor / total) * 10000) / 100 : 0,
    belumDinilai,
  };
}
