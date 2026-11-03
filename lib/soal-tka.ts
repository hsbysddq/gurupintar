import type {
  ButirPilihan,
  DataPilihanSoal,
  KodePilihan,
  PilihanMenjodohkan,
  PilihanSoal,
  TipeSoal,
} from './tipe';

export const DAFTAR_TIPE_SOAL: readonly TipeSoal[] = [
  'pilgan',
  'pilgan_kompleks',
  'benar_salah',
  'isian_singkat',
  'menjodohkan',
  'esai',
];

export const LABEL_TIPE_SOAL: Record<TipeSoal, string> = {
  pilgan: 'Pilihan ganda',
  pilgan_kompleks: 'Pilihan ganda kompleks (TKA)',
  benar_salah: 'Benar / Salah per pernyataan (TKA)',
  isian_singkat: 'Isian singkat (TKA)',
  menjodohkan: 'Menjodohkan (TKA)',
  esai: 'Esai / Uraian',
};

export const PETUNJUK_TIPE_SOAL: Record<TipeSoal, string> = {
  pilgan: 'Pilih satu jawaban yang paling tepat',
  pilgan_kompleks: 'Centang semua jawaban yang benar (bisa lebih dari satu)',
  benar_salah: 'Pilih Benar atau Salah untuk setiap pernyataan',
  isian_singkat: 'Ketik jawaban singkat yang tepat',
  menjodohkan: 'Pasangkan setiap bagian di kiri dengan jawaban yang sesuai',
  esai: 'Tulis jawaban uraianmu dengan jelas',
};

const KODE_ABCD = new Set<string>(['A', 'B', 'C', 'D']);
const HURUF_PASANGAN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function adalahTipeSoal(nilai: unknown): nilai is TipeSoal {
  return typeof nilai === 'string' && (DAFTAR_TIPE_SOAL as readonly string[]).includes(nilai);
}

export function normalisasiTipeSoal(nilai: unknown): TipeSoal {
  return adalahTipeSoal(nilai) ? nilai : 'pilgan';
}

export function adalahPilihanMenjodohkan(pilihan: DataPilihanSoal | unknown): pilihan is PilihanMenjodohkan {
  return (
    typeof pilihan === 'object' &&
    pilihan !== null &&
    !Array.isArray(pilihan) &&
    'kiri' in pilihan &&
    'kanan' in pilihan &&
    Array.isArray((pilihan as PilihanMenjodohkan).kiri) &&
    Array.isArray((pilihan as PilihanMenjodohkan).kanan)
  );
}

export function ambilDaftarPilihan(pilihan: DataPilihanSoal | unknown): ButirPilihan[] {
  return Array.isArray(pilihan) ? (pilihan as PilihanSoal[]) : [];
}

/** Mengurutkan dan menyaring kode A–D unik menjadi bentuk kanonik seperti "A,C". */
export function normalisasiPilganKompleks(kodeList: readonly string[]): string {
  const unik = [...new Set(kodeList.map((k) => k.trim().toUpperCase()).filter((k) => KODE_ABCD.has(k)))];
  unik.sort();
  return unik.join(',');
}

export function uraiPilganKompleks(nilai: string | null | undefined): KodePilihan[] {
  if (!nilai) return [];
  const hasil = normalisasiPilganKompleks(nilai.split(','));
  return hasil ? (hasil.split(',') as KodePilihan[]) : [];
}

/** Mengubah daftar "B"/"S" menjadi "B,S,B". */
export function normalisasiBenarSalah(daftar: readonly ('B' | 'S')[]): string {
  return daftar.join(',');
}

export function uraiBenarSalah(nilai: string | null | undefined, panjang?: number): ('B' | 'S' | '')[] {
  const potongan = nilai ? nilai.split(',').map((s) => (s === 'B' || s === 'S' ? s : '')) : [];
  if (panjang === undefined) return potongan;
  return Array.from({ length: panjang }, (_, i) => potongan[i] ?? '');
}

/**
 * Menormalkan jawaban isian singkat agar:
 * - tidak peka huruf besar-kecil dan spasi berlebih,
 * - koma desimal di antara digit disamakan dengan titik ("0,5" -> "0.5", "12,5 cm" -> "12.5 cm"),
 * - bilangan murni disamakan bentuk kanoniknya ("0,50" == "0.5", "03" == "3", "-0" == "0").
 */
export function normalisasiIsianSingkat(teks: string): string {
  const rapi = teks
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(\d),(\d)/g, '$1.$2');

  if (/^[+-]?\d+(\.\d+)?$/.test(rapi)) {
    const negatif = rapi.startsWith('-');
    const tanpaTanda = rapi.replace(/^[+-]/, '');
    const [utuhMentah, pecahanMentah = ''] = tanpaTanda.split('.');
    const utuh = utuhMentah.replace(/^0+(?=\d)/, '');
    const pecahan = pecahanMentah.replace(/0+$/, '');
    const gabungan = pecahan ? `${utuh}.${pecahan}` : utuh;
    if (gabungan === '0') return '0';
    return negatif ? `-${gabungan}` : gabungan;
  }

  return rapi;
}

export function simpanKunciIsianSingkat(daftar: readonly string[]): string {
  return JSON.stringify(daftar.map((d) => d.trim()).filter((d) => d.length > 0));
}

export function uraiKunciIsianSingkat(kunciDb: string): string[] {
  const rapi = kunciDb.trim();
  if (!rapi) return [];
  if (rapi.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(rapi);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim());
      }
    } catch {
      // Jatuh ke nilai tunggal di bawah bila bukan JSON valid.
    }
  }
  return [rapi];
}

function hashDeterministik(teks: string): number {
  let h = 2166136261;
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Menyusun soal menjodohkan agar urutan kolom kanan tidak membocorkan pasangan kunci ke browser siswa.
 * Mengembalikan `{ pilihan: { kiri, kanan }, kunci: "1:B,2:A,..." }`.
 */
export function susunPilihanMenjodohkan(pasangan: readonly { kiri: string; kanan: string }[]): {
  pilihan: PilihanMenjodohkan;
  kunci: string;
} {
  const kiri: ButirPilihan[] = pasangan.map((p, i) => ({
    kode: String(i + 1),
    teks: p.kiri.trim(),
  }));

  const indeksKanan = pasangan.map((p, idxAsal) => ({
    idxAsal,
    teks: p.kanan.trim(),
    bobot: hashDeterministik(`${idxAsal}:${p.kiri.trim()}->${p.kanan.trim()}`),
  }));

  indeksKanan.sort((a, b) => a.bobot - b.bobot || a.teks.localeCompare(b.teks, 'id'));
  // Jika kebetulan urutannya identik 0..n-1 dan ada minimal 2 baris, geser satu posisi agar tidak selalu 1:A, 2:B.
  if (indeksKanan.length >= 2 && indeksKanan.every((item, idx) => item.idxAsal === idx)) {
    const pertama = indeksKanan.shift()!;
    indeksKanan.push(pertama);
  }

  const kodeKananUntukAsal = new Map<number, string>();
  const kanan: ButirPilihan[] = indeksKanan.map((item, idx) => {
    const kode = HURUF_PASANGAN[idx] ?? String.fromCharCode(65 + idx);
    kodeKananUntukAsal.set(item.idxAsal, kode);
    return { kode, teks: item.teks };
  });

  const kunci = kiri.map((k, idx) => `${k.kode}:${kodeKananUntukAsal.get(idx)!}`).join(',');
  return { pilihan: { kiri, kanan }, kunci };
}

export function uraiJawabanMenjodohkan(nilai: string | null | undefined): Record<string, string> {
  if (!nilai) return {};
  const peta: Record<string, string> = {};
  for (const bagian of nilai.split(',')) {
    const [kiri, kanan] = bagian.split(':');
    if (kiri && kanan) peta[kiri.trim()] = kanan.trim();
  }
  return peta;
}

export function formatJawabanMenjodohkan(peta: Record<string, string>, kodeKiri: readonly string[]): string {
  return kodeKiri
    .filter((k) => Boolean(peta[k]))
    .map((k) => `${k}:${peta[k]}`)
    .join(',');
}

/** Mengembalikan pasangan kiri-kanan asli milik guru dari `pilihan` dan `kunci` untuk form Ubah Topik. */
export function rekonstruksiPasanganMenjodohkan(
  pilihan: DataPilihanSoal,
  kunci: string,
): { kiri: string; kanan: string }[] {
  if (!adalahPilihanMenjodohkan(pilihan)) return [];
  const petaKunci = uraiJawabanMenjodohkan(kunci);
  const petaKanan = new Map(pilihan.kanan.map((k) => [k.kode, k.teks]));
  return pilihan.kiri.map((k) => ({
    kiri: k.teks,
    kanan: petaKanan.get(petaKunci[k.kode] ?? '') ?? '',
  }));
}

/** Mengecek apakah satu soal sudah dijawab lengkap di layar kuis siswa. */
export function sudahTerjawabSoal(
  soal: { tipe?: TipeSoal; pilihan: DataPilihanSoal },
  nilai: string | undefined,
): boolean {
  if (!nilai) return false;
  const tipe = soal.tipe ?? 'pilgan';

  if (tipe === 'pilgan') {
    return KODE_ABCD.has(nilai);
  }
  if (tipe === 'pilgan_kompleks') {
    return uraiPilganKompleks(nilai).length >= 1;
  }
  if (tipe === 'benar_salah') {
    const daftar = ambilDaftarPilihan(soal.pilihan);
    if (daftar.length === 0) return false;
    const isian = uraiBenarSalah(nilai, daftar.length);
    return isian.every((v) => v === 'B' || v === 'S');
  }
  if (tipe === 'menjodohkan') {
    if (!adalahPilihanMenjodohkan(soal.pilihan) || soal.pilihan.kiri.length === 0) return false;
    const kodeKanan = new Set(soal.pilihan.kanan.map((k) => k.kode));
    const peta = uraiJawabanMenjodohkan(nilai);
    return soal.pilihan.kiri.every((k) => Boolean(peta[k.kode]) && kodeKanan.has(peta[k.kode]));
  }
  if (tipe === 'isian_singkat') {
    const rapi = nilai.trim();
    return rapi.length >= 1 && rapi.length <= 200;
  }
  // esai
  const rapi = nilai.trim();
  return rapi.length >= 1 && rapi.length <= 2000;
}

export type HasilPenilaianSoal =
  | { valid: false }
  | { valid: true; pilihanKanoni: string; benar: boolean; belumDinilai: boolean };

/**
 * Memvalidasi format jawaban siswa terhadap struktur soal di server sekaligus menghitung nilainya.
 * Semua tipe TKA objektif memakai aturan semua-atau-nol; esai ditandai `belumDinilai: true` untuk dinilai guru.
 */
export function periksaDanNilaiJawaban(
  soal: { tipe?: TipeSoal | string | null; pilihan: unknown; kunci: string },
  jawabanMentah: string,
): HasilPenilaianSoal {
  const tipe = normalisasiTipeSoal(soal.tipe);
  const mentah = jawabanMentah.trim();
  if (!mentah) return { valid: false };

  if (tipe === 'pilgan') {
    if (!KODE_ABCD.has(mentah)) return { valid: false };
    return {
      valid: true,
      pilihanKanoni: mentah,
      benar: mentah === soal.kunci,
      belumDinilai: false,
    };
  }

  if (tipe === 'pilgan_kompleks') {
    const bagian = mentah.split(',').map((s) => s.trim().toUpperCase());
    if (bagian.length === 0 || bagian.some((k) => !KODE_ABCD.has(k))) return { valid: false };
    const kanoni = normalisasiPilganKompleks(bagian);
    if (!kanoni) return { valid: false };
    return {
      valid: true,
      pilihanKanoni: kanoni,
      benar: kanoni === normalisasiPilganKompleks(soal.kunci.split(',')),
      belumDinilai: false,
    };
  }

  if (tipe === 'benar_salah') {
    const daftar = ambilDaftarPilihan(soal.pilihan);
    const bagian = mentah.split(',').map((s) => s.trim().toUpperCase());
    if (daftar.length === 0 || bagian.length !== daftar.length) return { valid: false };
    if (bagian.some((b) => b !== 'B' && b !== 'S')) return { valid: false };
    const kanoni = bagian.join(',');
    return {
      valid: true,
      pilihanKanoni: kanoni,
      benar: kanoni === soal.kunci,
      belumDinilai: false,
    };
  }

  if (tipe === 'isian_singkat') {
    if (mentah.length > 200) return { valid: false };
    const daftarKunci = uraiKunciIsianSingkat(soal.kunci);
    const target = normalisasiIsianSingkat(mentah);
    const benar = target.length > 0 && daftarKunci.some((k) => normalisasiIsianSingkat(k) === target);
    return {
      valid: true,
      pilihanKanoni: mentah,
      benar,
      belumDinilai: false,
    };
  }

  if (tipe === 'menjodohkan') {
    if (!adalahPilihanMenjodohkan(soal.pilihan) || soal.pilihan.kiri.length === 0) return { valid: false };
    const kodeKiri = soal.pilihan.kiri.map((k) => k.kode);
    const setKiri = new Set(kodeKiri);
    const setKanan = new Set(soal.pilihan.kanan.map((k) => k.kode));
    const pasangan = mentah.split(',');
    if (pasangan.length !== kodeKiri.length) return { valid: false };

    const peta: Record<string, string> = {};
    for (const item of pasangan) {
      const bagian = item.split(':');
      if (bagian.length !== 2) return { valid: false };
      const kiri = bagian[0].trim();
      const kanan = bagian[1].trim();
      if (!setKiri.has(kiri) || !setKanan.has(kanan) || kiri in peta) return { valid: false };
      peta[kiri] = kanan;
    }

    const kanoni = formatJawabanMenjodohkan(peta, kodeKiri);
    return {
      valid: true,
      pilihanKanoni: kanoni,
      benar: kanoni === soal.kunci,
      belumDinilai: false,
    };
  }

  // esai: menunggu penilaian manual guru
  if (mentah.length > 2000) return { valid: false };
  return {
    valid: true,
    pilihanKanoni: mentah,
    benar: false,
    belumDinilai: true,
  };
}

