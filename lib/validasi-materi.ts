import { z } from 'zod';

// Skema isi materi (architecture.md 8.5). Dipakai untuk keluaran AI, materi cadangan, dan PATCH guru.
export const skemaIsiMateri = z.object({
  judul: z.string().min(5).max(80),
  ringkasan: z.string().min(80).max(1200),
  naskah_audio: z.string().min(50).max(900),
  ide_video: z.object({
    judul: z.string().min(5).max(80),
    deskripsi: z.string().min(20).max(300),
    kata_kunci_pencarian: z.string().min(3).max(80),
  }),
  latihan: z.array(z.object({
    soal: z.string().min(10).max(300),
    pilihan: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
    kunci: z.enum(['A', 'B', 'C', 'D']),
    pembahasan: z.string().min(10).max(400),
  })).length(3),
});

export type IsiMateri = z.infer<typeof skemaIsiMateri>;
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
    isi.ide_video.judul,
    isi.ide_video.deskripsi,
    isi.ide_video.kata_kunci_pencarian,
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
