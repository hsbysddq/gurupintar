import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import materiCadangan from '@/data/materi-cadangan.json';
import {
  buatMateriSemua,
  ErrorMateriAi,
  INSTRUKSI_SISTEM,
  susunPesanPengguna,
  uraiKeluaranAi,
  type KlienAi,
  type KonteksMateri,
} from '@/lib/server/materi-ai';

const ISI_VALID = materiCadangan.belum;
/** acak() mendekati 1 membuat Fisher–Yates tidak menukar apa pun. */
const TANPA_ACAK = () => 0.999999;

const konteks = (kelompok: KonteksMateri['kelompok']): KonteksMateri => ({
  kelompok,
  namaTopik: 'Pecahan Senilai',
  capaianPembelajaran: 'Siswa dapat menentukan pecahan senilai.',
  jumlahSiswa: 4,
  miskonsepsi: ['Menambah pembilang dan penyebut dengan bilangan yang sama'],
});

function responsTeks(teks: string): Anthropic.Message {
  return { content: [{ type: 'text', text: teks, citations: null }] } as unknown as Anthropic.Message;
}

type OpsiPanggilan = { signal?: AbortSignal; timeout?: number };

function klienTiruan(
  impl: (body: Anthropic.MessageCreateParamsNonStreaming, opsi?: OpsiPanggilan) => Promise<Anthropic.Message>,
) {
  const create = vi.fn(impl);
  const klien: KlienAi = { messages: { create } };
  return { klien, create };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('INSTRUKSI_SISTEM', () => {
  it('sama persis dengan architecture.md 9.3', () => {
    const dokumen = readFileSync(fileURLToPath(new URL('../architecture.md', import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
    const bagian = dokumen.split('### 9.3 Instruksi sistem (salin persis)')[1];
    const blok = /```text\n([\s\S]*?)\n```/.exec(bagian)?.[1];
    expect(blok).toBeDefined();
    expect(INSTRUKSI_SISTEM).toBe(blok);
  });
});

describe('susunPesanPengguna (architecture.md 9.4)', () => {
  it('mengikuti templat dan tujuan kelompok', () => {
    const pesan = susunPesanPengguna(konteks('setengah'));
    expect(pesan).toBe(
      [
        'Topik: Pecahan Senilai',
        'Capaian pembelajaran: Siswa dapat menentukan pecahan senilai.',
        'Jumlah siswa sasaran: 4',
        'Kesalahan pemahaman yang paling sering muncul: Menambah pembilang dan penyebut dengan bilangan yang sama',
        '',
        'Tujuan materi:',
        'Buat latihan terarah yang secara khusus meluruskan kesalahan pemahaman di atas. Jelaskan singkat mengapa cara yang salah itu keliru, lalu beri latihan setara soal kuis.',
      ].join('\n'),
    );
  });

  it('menulis "tidak ada data" jika tidak ada miskonsepsi', () => {
    expect(susunPesanPengguna({ ...konteks('sudah'), miskonsepsi: [] })).toContain(
      'Kesalahan pemahaman yang paling sering muncul: tidak ada data',
    );
  });
});

describe('uraiKeluaranAi', () => {
  it('menerima JSON polos', () => {
    expect(uraiKeluaranAi(JSON.stringify(ISI_VALID))).toEqual({ ok: true, isi: ISI_VALID });
  });

  it('menghapus pagar kode ```json', () => {
    expect(uraiKeluaranAi('```json\n' + JSON.stringify(ISI_VALID) + '\n```').ok).toBe(true);
  });

  it('menghapus pagar kode ``` tanpa bahasa', () => {
    expect(uraiKeluaranAi('```\n' + JSON.stringify(ISI_VALID) + '\n```').ok).toBe(true);
  });

  it('menolak teks yang bukan JSON', () => {
    expect(uraiKeluaranAi('Berikut materinya: {')).toEqual({ ok: false, alasan: 'Balasan bukan satu objek JSON yang valid.' });
  });

  it('menolak JSON yang tidak lolos periksaIsiMateri', () => {
    const hasil = uraiKeluaranAi(JSON.stringify({ ...ISI_VALID, judul: 'Untuk kelompok belum paham' }));
    expect(hasil.ok).toBe(false);
  });
});

describe('buatMateriSemua', () => {
  it('memanggil AI sekali per kelompok dengan instruksi sistem dan max_tokens 2000', async () => {
    const { klien, create } = klienTiruan(async () => responsTeks(JSON.stringify(ISI_VALID)));
    const hasil = await buatMateriSemua([konteks('belum'), konteks('sudah')], { klien, model: 'model-uji', acak: TANPA_ACAK });

    expect(create).toHaveBeenCalledTimes(2);
    const [body, opsi] = create.mock.calls[0];
    expect(body).toMatchObject({ model: 'model-uji', max_tokens: 2000, system: INSTRUKSI_SISTEM });
    expect(opsi?.signal).toBeInstanceOf(AbortSignal);
    expect(opsi?.timeout).toBeGreaterThan(0);
    expect(hasil.belum).toEqual(ISI_VALID);
    expect(hasil.sudah).toEqual(ISI_VALID);
    expect(hasil.setengah).toBeUndefined();
  });

  it('mengacak posisi pilihan keluaran AI dan menyesuaikan kunci', async () => {
    const { klien } = klienTiruan(async () => responsTeks(JSON.stringify(ISI_VALID)));
    const hasil = await buatMateriSemua([konteks('belum')], { klien, model: 'model-uji', acak: () => 0 });

    hasil.belum!.latihan.forEach((l, i) => {
      const asal = ISI_VALID.latihan[i];
      // acak() = 0 → urutan [1, 2, 3, 0].
      expect(l.pilihan).toEqual([asal.pilihan[1], asal.pilihan[2], asal.pilihan[3], asal.pilihan[0]]);
      expect(l.pilihan['ABCD'.indexOf(l.kunci)]).toBe(asal.pilihan['ABCD'.indexOf(asal.kunci)]);
    });
  });

  it('mencoba sekali lagi dengan alasan kegagalan jika format tidak valid', async () => {
    const { klien, create } = klienTiruan(async () =>
      create.mock.calls.length === 1 ? responsTeks('bukan json') : responsTeks(JSON.stringify(ISI_VALID)),
    );
    const hasil = await buatMateriSemua([konteks('belum')], { klien, model: 'model-uji', acak: TANPA_ACAK });

    expect(create).toHaveBeenCalledTimes(2);
    const pesanKedua = create.mock.calls[1][0].messages[0].content as string;
    expect(pesanKedua).toContain('Balasanmu sebelumnya ditolak karena: Balasan bukan satu objek JSON yang valid.');
    expect(hasil.belum).toEqual(ISI_VALID);
  });

  it('melempar ErrorMateriAi jika dua percobaan gagal', async () => {
    const { klien, create } = klienTiruan(async () => responsTeks('bukan json'));
    await expect(buatMateriSemua([konteks('belum')], { klien, model: 'model-uji' })).rejects.toBeInstanceOf(ErrorMateriAi);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('satu kelompok gagal → kelompok lain dibatalkan dan semuanya gagal', async () => {
    let sinyalLain: AbortSignal | undefined;
    const { klien } = klienTiruan(async (body, opsi) => {
      const pesan = body.messages[0].content as string;
      if (pesan.includes('tantangan')) {
        sinyalLain = opsi?.signal;
        return new Promise<Anthropic.Message>((_, tolak) => {
          opsi?.signal?.addEventListener('abort', () => tolak(new Error('dibatalkan')));
        });
      }
      throw new Error('API gagal');
    });

    await expect(buatMateriSemua([konteks('belum'), konteks('sudah')], { klien, model: 'model-uji' })).rejects.toBeInstanceOf(
      ErrorMateriAi,
    );
    expect(sinyalLain?.aborted).toBe(true);
  });

  it('batas waktu berlaku untuk seluruh proses, bukan per panggilan', async () => {
    vi.useFakeTimers();
    const timeoutDiterima: number[] = [];
    const { klien, create } = klienTiruan(async (_, opsi) => {
      timeoutDiterima.push(opsi?.timeout ?? 0);
      // Percobaan pertama memakan 700 ms lalu formatnya tidak valid.
      await vi.advanceTimersByTimeAsync(700);
      return responsTeks('bukan json');
    });

    const janji = buatMateriSemua([konteks('belum')], { klien, model: 'model-uji', batasMs: 1000 });
    await expect(janji).rejects.toBeInstanceOf(ErrorMateriAi);
    expect(create).toHaveBeenCalledTimes(2);
    // Percobaan kedua hanya mendapat sisa waktu total.
    expect(timeoutDiterima[0]).toBe(1000);
    expect(timeoutDiterima[1]).toBe(300);
  });

  it('tidak mencoba ulang jika waktu sudah habis', async () => {
    vi.useFakeTimers();
    const { klien, create } = klienTiruan(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      return responsTeks('bukan json');
    });

    await expect(buatMateriSemua([konteks('belum')], { klien, model: 'model-uji', batasMs: 1000 })).rejects.toThrow(
      /gagal dibuat/,
    );
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('membatalkan panggilan yang sedang berjalan saat batas waktu total habis', async () => {
    vi.useFakeTimers();
    const { klien } = klienTiruan(
      (_, opsi) =>
        new Promise<Anthropic.Message>((_, tolak) => {
          opsi?.signal?.addEventListener('abort', () => tolak(new Error('dibatalkan')));
        }),
    );

    const janji = buatMateriSemua([konteks('belum')], { klien, model: 'model-uji', batasMs: 1000 });
    const diperiksa = expect(janji).rejects.toThrow('Batas waktu pembuatan materi habis atau dibatalkan.');
    await vi.advanceTimersByTimeAsync(1000);
    await diperiksa;
  });

  it('melempar ErrorMateriAi jika ANTHROPIC_API_KEY kosong', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('ANTHROPIC_MODEL', 'model-uji');
    await expect(buatMateriSemua([konteks('belum')])).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it('melempar ErrorMateriAi jika ANTHROPIC_MODEL kosong', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'kunci-uji');
    vi.stubEnv('ANTHROPIC_MODEL', '');
    await expect(buatMateriSemua([konteks('belum')])).rejects.toThrow(/ANTHROPIC_MODEL/);
  });
});
