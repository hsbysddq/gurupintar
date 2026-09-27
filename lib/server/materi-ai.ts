import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { BATAS_WAKTU_AI_MS } from '@/lib/konstanta';
import type { Kelompok } from '@/lib/tipe';
import { acakPilihanLatihan, periksaIsiMateri, type HasilPeriksaMateri, type IsiMateri } from '@/lib/validasi-materi';

// Instruksi sistem disalin persis dari architecture.md 9.3 (dijaga oleh tests/materi-ai.test.ts).
export const INSTRUKSI_SISTEM = `Kamu adalah asisten guru matematika SMP di Indonesia. Tugasmu membuat materi lanjutan singkat untuk siswa kelas 7.

Aturan keluaran:
- Balas HANYA dengan satu objek JSON yang valid. Tanpa teks pembuka, penutup, atau pagar kode.
- Struktur JSON:
  {"judul": string, "ringkasan": string, "naskah_audio": string,
   "ide_video": {"judul": string, "deskripsi": string, "kata_kunci_pencarian": string},
   "latihan": [{"soal": string, "pilihan": [string, string, string, string], "kunci": "A"|"B"|"C"|"D", "pembahasan": string}]}
- "latihan" berisi tepat 3 soal. Setiap soal punya tepat satu jawaban benar, empat pilihan yang berbeda, dan "kunci" menunjuk pilihan yang benar (A = pilihan pertama).
- Di "pembahasan", jangan menyebut huruf pilihan (A, B, C, D); sebut nilai jawabannya.

Aturan isi:
- Bahasa Indonesia yang sederhana, ramah, dan menyemangati untuk anak usia 12–13 tahun. Hindari pujian berlebihan.
- Tulis pecahan sebagai teks biasa seperti 2/3. Jangan memakai LaTeX atau simbol khusus.
- "ringkasan": 80–1200 karakter, menjelaskan konsep dengan contoh sehari-hari (kue, pizza, uang, dsb.).
- "naskah_audio": 50–900 karakter, gaya bertutur seperti guru berbicara. Tulis pecahan dengan kata, misalnya "dua per tiga", agar enak dibacakan.
- "ide_video": ide video pendek yang bisa dicari siswa di YouTube; "kata_kunci_pencarian" dalam bahasa Indonesia.
- Jangan pernah menyebut label kelompok, tingkat kemampuan, atau kata "kelompok", "belum paham", "setengah paham", "sudah paham".
- Jangan menyertakan tautan, nama orang sungguhan, atau informasi pribadi.
- Periksa ulang semua hitungan sebelum menjawab. Kunci jawaban harus benar secara matematis.`;

// architecture.md 9.4
export const TUJUAN_KELOMPOK: Record<Kelompok, string> = {
  belum:
    'Buat materi penguatan konsep dasar dari awal, langkah demi langkah, dengan contoh konkret. Tujuannya agar siswa bisa mengejar dan memahami konsep inti, bukan sekadar soal yang lebih mudah. Soal latihan bertahap dari dasar ke setara soal kuis.',
  setengah:
    'Buat latihan terarah yang secara khusus meluruskan kesalahan pemahaman di atas. Jelaskan singkat mengapa cara yang salah itu keliru, lalu beri latihan setara soal kuis.',
  sudah:
    'Buat materi tantangan: penerapan dalam situasi sehari-hari dan soal penalaran yang sedikit di atas soal kuis.',
};

/** Data yang boleh dikirim ke AI (architecture.md 9.2): tanpa nama siswa, ID, kode kelas, atau data sekolah. */
export interface KonteksMateri {
  kelompok: Kelompok;
  namaTopik: string;
  capaianPembelajaran: string;
  jumlahSiswa: number;
  miskonsepsi: string[];
}

export class ErrorMateriAi extends Error {
  constructor(pesan: string, options?: { cause?: unknown }) {
    super(pesan, options);
    this.name = 'ErrorMateriAi';
  }
}

/** Bagian klien Anthropic yang dipakai; memudahkan klien tiruan di tes. */
export interface KlienAi {
  messages: {
    create(
      body: Anthropic.MessageCreateParamsNonStreaming,
      options?: { signal?: AbortSignal; timeout?: number },
    ): PromiseLike<Anthropic.Message>;
  };
}

export function susunPesanPengguna(k: KonteksMateri): string {
  const miskonsepsi = k.miskonsepsi.length > 0 ? k.miskonsepsi.join('; ') : 'tidak ada data';
  return [
    `Topik: ${k.namaTopik}`,
    `Capaian pembelajaran: ${k.capaianPembelajaran}`,
    `Jumlah siswa sasaran: ${k.jumlahSiswa}`,
    `Kesalahan pemahaman yang paling sering muncul: ${miskonsepsi}`,
    '',
    'Tujuan materi:',
    TUJUAN_KELOMPOK[k.kelompok],
  ].join('\n');
}

/** Hapus pagar kode, JSON.parse, lalu periksaIsiMateri (architecture.md 9.1). */
export function uraiKeluaranAi(teks: string): HasilPeriksaMateri {
  const bersih = teks
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  let data: unknown;
  try {
    data = JSON.parse(bersih);
  } catch {
    return { ok: false, alasan: 'Balasan bukan satu objek JSON yang valid.' };
  }
  return periksaIsiMateri(data);
}

function pesanPerbaikan(k: KonteksMateri, alasan: string): string {
  return `${susunPesanPengguna(k)}\n\nBalasanmu sebelumnya ditolak karena: ${alasan}\nPerbaiki, lalu balas lagi hanya dengan satu objek JSON yang valid.`;
}

async function buatUntukKelompok(
  klien: KlienAi,
  model: string,
  k: KonteksMateri,
  tenggat: number,
  signal: AbortSignal,
  acak: () => number,
): Promise<IsiMateri> {
  let pesan = susunPesanPengguna(k);
  let alasan = 'waktu habis sebelum materi selesai dibuat';

  // Percobaan kedua hanya jika format tidak valid dan waktu masih tersisa.
  for (let percobaan = 0; percobaan < 2; percobaan++) {
    const sisa = tenggat - Date.now();
    if (sisa <= 0 || signal.aborted) break;

    const respons = await klien.messages.create(
      { model, max_tokens: 2000, system: INSTRUKSI_SISTEM, messages: [{ role: 'user', content: pesan }] },
      { signal, timeout: sisa },
    );
    const teks = respons.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const hasil = uraiKeluaranAi(teks);
    // Posisi kunci diacak setelah lolos pemeriksaan agar tidak bisa ditebak (misalnya selalu "B").
    if (hasil.ok) return acakPilihanLatihan(hasil.isi, acak);

    alasan = hasil.alasan;
    pesan = pesanPerbaikan(k, hasil.alasan);
  }
  throw new ErrorMateriAi(`Materi untuk ${k.kelompok} gagal dibuat: ${alasan}`);
}

function buatKlienBawaan(): { klien: KlienAi; model: string } {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  // Diperiksa eksplisit agar SDK tidak diam-diam memakai kredensial lain.
  if (!apiKey) throw new ErrorMateriAi('ANTHROPIC_API_KEY belum diisi di .env.local');
  if (!model) throw new ErrorMateriAi('ANTHROPIC_MODEL belum diisi di .env.local');
  return { klien: new Anthropic({ apiKey, maxRetries: 1 }), model };
}

/**
 * Membuat materi untuk semua kelompok target secara paralel (architecture.md 9.1).
 * Seluruh proses dibatasi `batasMs` total: satu AbortController dengan tenggat bersama,
 * dan kegagalan satu kelompok membatalkan kelompok lain (semua atau tidak sama sekali).
 */
export async function buatMateriSemua(
  daftar: KonteksMateri[],
  opsi: { klien?: KlienAi; model?: string; batasMs?: number; acak?: () => number } = {},
): Promise<Record<Kelompok, IsiMateri | undefined>> {
  const { klien, model } = opsi.klien && opsi.model ? { klien: opsi.klien, model: opsi.model } : buatKlienBawaan();
  const batasMs = opsi.batasMs ?? BATAS_WAKTU_AI_MS;
  const acak = opsi.acak ?? Math.random;
  const tenggat = Date.now() + batasMs;
  const pengendali = new AbortController();
  const penghitung = setTimeout(() => pengendali.abort(), batasMs);

  try {
    const hasil = await Promise.all(
      daftar.map((k) =>
        buatUntukKelompok(klien, model, k, tenggat, pengendali.signal, acak).catch((err: unknown) => {
          pengendali.abort();
          throw err;
        }),
      ),
    );
    const materi: Record<Kelompok, IsiMateri | undefined> = { sudah: undefined, setengah: undefined, belum: undefined };
    daftar.forEach((k, i) => {
      materi[k.kelompok] = hasil[i];
    });
    return materi;
  } catch (err) {
    if (err instanceof ErrorMateriAi) throw err;
    const pesan = pengendali.signal.aborted ? 'Batas waktu pembuatan materi habis atau dibatalkan.' : 'Panggilan AI gagal.';
    throw new ErrorMateriAi(pesan, { cause: err });
  } finally {
    clearTimeout(penghitung);
  }
}
