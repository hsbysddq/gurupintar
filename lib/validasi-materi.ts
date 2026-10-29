import { z } from 'zod';

// Skema isi materi (architecture.md 8.5). Dipakai untuk keluaran AI, materi cadangan, dan PATCH guru.
export const skemaIsiMateri = z.object({
  judul: z.string().min(5).max(80),
  ringkasan: z.string().min(80).max(1200),
  naskah_audio: z.string().min(50).max(900),
  slide_ppt: z.object({
    judul: z.string().min(5).max(80),
    slide: z.array(z.object({
      judul: z.string().min(3).max(60),
      poin: z.array(z.string().min(5).max(160)).min(2).max(4),
    })).min(3).max(8),
  }),
  latihan: z.array(z.object({
    soal: z.string().min(10).max(300),
    pilihan: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
    kunci: z.enum(['A', 'B', 'C', 'D']),
    pembahasan: z.string().min(10).max(400),
  })).length(3),
});

export type IsiMateri = z.infer<typeof skemaIsiMateri>;
export type SlidePpt = IsiMateri['slide_ppt']['slide'][number];
type Latihan = IsiMateri['latihan'][number];

export type HasilPeriksaMateri = { ok: true; isi: IsiMateri } | { ok: false; alasan: string };

// PRD D-2: siswa tidak boleh melihat label kelompok.
const POLA_LABEL_KELOMPOK = /\b(belum|setengah|sudah)\s+paham\b/i;
const POLA_KATA_KELOMPOK = /kelompok/i;
const POLA_LATEX = /\\frac|\$/;
// Pembahasan tidak boleh menunjuk huruf pilihan karena urutan pilihan diacak di server (acakPilihanLatihan).
// Contoh yang ditolak: "pilihan B", "Jawaban C", "jawaban yang benar adalah D", "opsi (A)".
const POLA_HURUF_PILIHAN =
  /\b(?:[Pp]ilihan|[Jj]awaban|[Oo]psi)\s+(?:yang\s+(?:benar|tepat)\s+)?(?:(?:adalah|ialah)\s+)?\(?[A-D]\)?(?![\w/])/;

/** Alasan dalam bahasa Indonesia; dikirim balik ke AI saat mencoba ulang dan ditampilkan ke guru. */
function jelaskanMasalahSkema(masalah: z.core.$ZodIssue): string {
  const bagian = masalah.path.length > 0 ? masalah.path.join('.') : 'isi';
  switch (masalah.code) {
    case 'too_small':
      return `Bagian "${bagian}" terlalu pendek atau terlalu sedikit (minimal ${String(masalah.minimum)}).`;
    case 'too_big':
      return `Bagian "${bagian}" terlalu panjang atau terlalu banyak (maksimal ${String(masalah.maximum)}).`;
    case 'invalid_type':
      return `Bagian "${bagian}" tidak ada atau tipenya salah (seharusnya ${masalah.expected}).`;
    case 'invalid_value':
      return `Bagian "${bagian}" berisi nilai yang tidak diizinkan.`;
    default:
      return `Bagian "${bagian}" tidak valid.`;
  }
}

function semuaTeks(isi: IsiMateri): string[] {
  return [
    isi.judul,
    isi.ringkasan,
    isi.naskah_audio,
    isi.slide_ppt.judul,
    ...isi.slide_ppt.slide.flatMap((s) => [s.judul, ...s.poin]),
    ...isi.latihan.flatMap((l) => [l.soal, ...l.pilihan, l.pembahasan]),
  ];
}

export function periksaIsiMateri(data: unknown): HasilPeriksaMateri {
  const hasil = skemaIsiMateri.safeParse(data);
  if (!hasil.success) return { ok: false, alasan: jelaskanMasalahSkema(hasil.error.issues[0]) };
  const isi = hasil.data;

  for (const [i, latihan] of isi.latihan.entries()) {
    const unik = new Set(latihan.pilihan.map((p) => p.trim().toLowerCase()));
    if (unik.size !== latihan.pilihan.length) {
      return { ok: false, alasan: `Empat pilihan pada soal latihan ${i + 1} harus berbeda satu sama lain.` };
    }
  }

  for (const [i, latihan] of isi.latihan.entries()) {
    if (POLA_HURUF_PILIHAN.test(latihan.pembahasan)) {
      return {
        ok: false,
        alasan: `Pembahasan soal latihan ${i + 1} tidak boleh menyebut huruf pilihan (A, B, C, D); sebut nilai jawabannya.`,
      };
    }
  }

  for (const teks of semuaTeks(isi)) {
    if (POLA_LABEL_KELOMPOK.test(teks)) {
      return { ok: false, alasan: 'Teks tidak boleh menyebut label kelompok (belum paham, setengah paham, sudah paham).' };
    }
    if (POLA_KATA_KELOMPOK.test(teks)) {
      return { ok: false, alasan: 'Teks tidak boleh memuat kata "kelompok".' };
    }
    if (POLA_LATEX.test(teks)) {
      return { ok: false, alasan: 'Teks tidak boleh memakai notasi LaTeX (\\frac atau $). Tulis pecahan seperti 2/3.' };
    }
  }

  return { ok: true, isi };
}

const KODE_PILIHAN = ['A', 'B', 'C', 'D'] as const;

const BATAS_POIN = 160;

function kalimatDari(teks: string): string[] {
  return teks
    .split(/\n+/)
    .flatMap((baris) => baris.split(/(?<=[.!?])\s+/))
    .map((k) => k.trim())
    .filter((k) => k.length >= 5)
    .map((k) => (k.length <= BATAS_POIN ? k : `${k.slice(0, BATAS_POIN - 1).trimEnd()}…`));
}

/**
 * Materi lama (dibuat sebelum opsi Video diganti PPT) punya `ide_video` dan belum punya `slide_ppt`.
 * Fungsi ini melengkapinya saat dibaca: slide disusun dari ringkasan, naskah, dan soal latihan yang sudah ada,
 * supaya tab PPT tidak kosong dan guru tetap bisa menyimpan perubahan. Materi baru dikembalikan apa adanya.
 */
export function lengkapiIsiMateri(data: unknown): IsiMateri {
  if (typeof data !== 'object' || data === null) return data as IsiMateri;
  const mentah = data as Record<string, unknown>;
  if ('slide_ppt' in mentah) return data as IsiMateri;
  if (typeof mentah.judul !== 'string' || typeof mentah.ringkasan !== 'string' || typeof mentah.naskah_audio !== 'string' || !Array.isArray(mentah.latihan)) {
    return data as IsiMateri;
  }

  const kumpulan = [...kalimatDari(mentah.ringkasan), ...kalimatDari(mentah.naskah_audio)];
  const soal = (mentah.latihan as { soal?: unknown }[])
    .map((l) => (typeof l.soal === 'string' ? kalimatDari(l.soal)[0] ?? l.soal : ''))
    .filter((t) => t.length >= 5);
  const slide = [
    { judul: 'Ringkasan materi', poin: kumpulan.slice(0, 3) },
    { judul: 'Penjelasan', poin: kumpulan.length >= 5 ? kumpulan.slice(3, 6) : kumpulan.slice(-2) },
    { judul: 'Latihan', poin: soal.slice(0, 4) },
  ].filter((s) => s.poin.length >= 2);

  const { ide_video: _lama, ...sisanya } = mentah;
  void _lama;
  return { ...sisanya, slide_ppt: { judul: mentah.judul.slice(0, 80), slide } } as IsiMateri;
}

/**
 * Mengacak urutan empat pilihan tiap soal latihan (Fisher–Yates) dan menyesuaikan `kunci`,
 * sehingga kunci tetap menunjuk teks jawaban yang sama tetapi posisinya tidak bisa ditebak.
 * Hanya untuk keluaran AI; materi cadangan tidak diacak. `acak` bisa diganti agar tes deterministik.
 */
export function acakPilihanLatihan(isi: IsiMateri, acak: () => number = Math.random): IsiMateri {
  return {
    ...isi,
    latihan: isi.latihan.map((l) => {
      const urutan = [0, 1, 2, 3];
      for (let i = urutan.length - 1; i > 0; i--) {
        const j = Math.floor(acak() * (i + 1));
        [urutan[i], urutan[j]] = [urutan[j], urutan[i]];
      }
      const pilihan = urutan.map((asal) => l.pilihan[asal]) as Latihan['pilihan'];
      const kunci = KODE_PILIHAN[urutan.indexOf(KODE_PILIHAN.indexOf(l.kunci))];
      return { ...l, pilihan, kunci };
    }),
  };
}
