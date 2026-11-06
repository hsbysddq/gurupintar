import 'server-only';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GayaAudio } from '@/lib/tipe';

const BUCKET_AUDIO = 'materi-audio';
const MODEL_TTS = process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-3.8-flash-tts';
const SAMPEL_PER_DETIK = 24_000;

export const PESAN_AUDIO_BELUM_SIAP = 'Suara natural belum aktif. Hubungi admin.';
export const PESAN_AUDIO_GAGAL = 'Suara natural belum berhasil dibuat. Coba lagi sebentar.';

export class ErrorAudioAi extends Error {
  constructor(
    readonly pesanAman: string,
    detail: string,
  ) {
    super(detail);
    this.name = 'ErrorAudioAi';
  }
}

const ARAHAN_GAYA: Record<GayaAudio, string> = {
  docu:
    'Bacakan sebagai narator dokumenter Indonesia yang tenang, reflektif, dan hangat. Pakai jeda alami. Jangan terdengar seperti pembaca berita atau pengisi suara iklan.',
  podcast:
    'Bacakan sebagai host podcast Indonesia yang hangat dan mengobrol. Santai, jelas, dan tidak berlebihan.',
  dialog:
    'Bacakan dialog Indonesia berikut. Gunakan suara GURU dan SISWA sesuai label. Pertahankan jeda alami dan jangan membaca label sebagai narasi.',
  cerita:
    'Bacakan sebagai pendongeng Indonesia yang hangat. Tempo santai, ekspresif, dan tetap jelas untuk siswa.',
};

const SUARA_GAYA: Record<GayaAudio, string> = {
  docu: 'Kore',
  podcast: 'Puck',
  dialog: 'Kore',
  cerita: 'Puck',
};

export function susunPromptTts(teks: string, gaya: GayaAudio): string {
  const dialog =
    gaya === 'dialog'
      ? 'Ini adalah percakapan dua pembicara. Nama pembicara adalah GURU dan SISWA.'
      : 'Ini adalah narasi satu pembicara.';
  return [
    'Synthesize Indonesian speech only.',
    'Do not read these instructions, tags, or labels aloud.',
    ARAHAN_GAYA[gaya],
    dialog,
    '',
    '<TRANSCRIPT>',
    teks.trim(),
    '</TRANSCRIPT>',
  ].join('\n');
}

function speechConfig(gaya: GayaAudio): Record<string, unknown> {
  if (gaya === 'dialog') {
    return {
      languageCode: 'id-ID',
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          {
            speaker: 'GURU',
            voiceConfig: { prebuiltVoiceConfig: { voiceName: SUARA_GAYA.dialog } },
          },
          {
            speaker: 'SISWA',
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
        ],
      },
    };
  }

  return {
    languageCode: 'id-ID',
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: SUARA_GAYA[gaya] },
    },
  };
}

/** Bungkus PCM 24 kHz, 16-bit, mono dari Gemini menjadi WAV yang bisa diputar browser. */
export function bungkusWav(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPEL_PER_DETIK, 24);
  header.writeUInt32LE(SAMPEL_PER_DETIK * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function ringkasanBalasan(data: unknown): string {
  if (typeof data !== 'object' || data === null) return 'bukan objek';
  const kandidat = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(kandidat) || kandidat.length === 0) return 'tanpa candidates';

  const pertama = kandidat[0];
  if (typeof pertama !== 'object' || pertama === null) return 'candidate tidak valid';
  const isi = (pertama as { content?: { parts?: unknown } }).content;
  const bagian = Array.isArray(isi?.parts) ? isi.parts : [];
  const kunciBagian = bagian.flatMap((bagianItem) =>
    typeof bagianItem === 'object' && bagianItem !== null ? Object.keys(bagianItem) : [],
  );
  const teks = bagian
    .map((bagianItem) =>
      typeof bagianItem === 'object' && bagianItem !== null && 'text' in bagianItem && typeof bagianItem.text === 'string'
        ? bagianItem.text
        : '',
    )
    .join('')
    .slice(0, 180);

  return JSON.stringify({
    finishReason: (pertama as { finishReason?: unknown }).finishReason ?? null,
    promptFeedback: (data as { promptFeedback?: unknown }).promptFeedback ?? null,
    kunciBagian,
    teks: teks || null,
  });
}

/** Ambil inlineData audio dari balasan Gemini; kalau masih PCM, bungkus sebagai WAV. */
export function uraikanAudioGemini(data: unknown): Buffer {
  if (typeof data !== 'object' || data === null) {
    throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, 'Balasan Gemini bukan objek.');
  }

  const kandidat = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(kandidat)) {
    throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, 'Balasan Gemini tidak memiliki candidates.');
  }

  for (const kandidatItem of kandidat) {
    if (typeof kandidatItem !== 'object' || kandidatItem === null) continue;
    const bagian = (kandidatItem as { content?: { parts?: unknown } }).content?.parts;
    if (!Array.isArray(bagian)) continue;

    for (const item of bagian) {
      if (typeof item !== 'object' || item === null) continue;
      const inline = (item as { inlineData?: unknown }).inlineData;
      if (typeof inline !== 'object' || inline === null) continue;
      const dataAudio = (inline as { data?: unknown }).data;
      const mime = (inline as { mimeType?: unknown }).mimeType;
      if (typeof dataAudio !== 'string') continue;

      const biner = Buffer.from(dataAudio, 'base64');
      if (typeof mime === 'string' && mime.toLowerCase().includes('wav')) return biner;
      return bungkusWav(biner);
    }
  }

  throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, `Gemini tidak mengembalikan audio. ${ringkasanBalasan(data)}`);
}

export function hashAudio(teks: string, gaya: GayaAudio): string {
  return createHash('sha256').update(`${gaya}\n${teks.trim()}`).digest('hex');
}

/** Google AI Studio memakai dua format key: AIza (lama) dan AQ. (auth key baru). */
export function kunciGeminiValid(kunci: string): boolean {
  return /^(AIza|AQ\.)/.test(kunci);
}

export async function panggilGeminiTts(teks: string, gaya: GayaAudio): Promise<Buffer> {
  const kunci = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!kunci) throw new ErrorAudioAi(PESAN_AUDIO_BELUM_SIAP, 'GEMINI_API_KEY belum diisi.');
  if (!kunciGeminiValid(kunci)) {
    throw new ErrorAudioAi(
      PESAN_AUDIO_BELUM_SIAP,
      'GEMINI_API_KEY bukan API key Google AI Studio (harus diawali AIza atau AQ.).',
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_TTS}:generateContent`;
  let respons: Response;
  try {
    respons = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': kunci,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: susunPromptTts(teks, gaya) }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: speechConfig(gaya),
        },
      }),
      signal: AbortSignal.timeout(120_000),
      cache: 'no-store',
    });
  } catch (err) {
    throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, `Gemini TTS tidak bisa dihubungi: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!respons.ok) {
    let detail = `HTTP ${respons.status}`;
    try {
      const galat = (await respons.json()) as { error?: { message?: unknown } };
      if (typeof galat.error?.message === 'string') detail = `${detail}: ${galat.error.message}`;
    } catch {
      // Pakai status saja.
    }
    if (respons.status === 401 || respons.status === 403) {
      throw new ErrorAudioAi(PESAN_AUDIO_BELUM_SIAP, detail);
    }
    throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, detail);
  }

  return uraikanAudioGemini((await respons.json()) as unknown);
}

async function pastikanBucketAudio(db: SupabaseClient): Promise<void> {
  const { error } = await db.storage.getBucket(BUCKET_AUDIO);
  if (!error) return;

  const { error: galatBuat } = await db.storage.createBucket(BUCKET_AUDIO, { public: true });
  if (galatBuat && !/already exists|duplicate/i.test(galatBuat.message)) {
    throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, `Bucket audio gagal disiapkan: ${galatBuat.message}`);
  }
}

function urlPublik(db: SupabaseClient, path: string): string {
  return db.storage.from(BUCKET_AUDIO).getPublicUrl(path).data.publicUrl;
}

/** Ambil audio yang sudah pernah dibuat, atau buat baru lalu simpan di Supabase Storage. */
export async function ambilAtauBuatAudio(db: SupabaseClient, teks: string, gaya: GayaAudio): Promise<string> {
  const hash = hashAudio(teks, gaya);
  const path = `audio/${hash}.wav`;
  await pastikanBucketAudio(db);

  const { data: daftar } = await db.storage.from(BUCKET_AUDIO).list('audio', {
    search: `${hash}.wav`,
    limit: 1,
  });
  if (daftar?.some((berkas) => berkas.name === `${hash}.wav`)) return urlPublik(db, path);

  const wav = await panggilGeminiTts(teks, gaya);
  const { error } = await db.storage.from(BUCKET_AUDIO).upload(path, wav, {
    contentType: 'audio/wav',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new ErrorAudioAi(PESAN_AUDIO_GAGAL, `Upload audio gagal: ${error.message}`);

  return urlPublik(db, path);
}
