import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bungkusWav,
  ErrorAudioAi,
  hashAudio,
  kunciGeminiValid,
  PESAN_AUDIO_BELUM_SIAP,
  panggilGeminiTts,
  susunPromptTts,
  uraikanAudioGemini,
} from '@/lib/server/audio-gemini';

const PCM = Buffer.from([1, 2, 3, 4, 5, 6]);

function balasanAudio(data: string, mimeType = 'audio/L16;codec=pcm;rate=24000') {
  return {
    candidates: [
      {
        content: {
          parts: [{ inlineData: { data, mimeType } }],
        },
      },
    ],
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('audio Gemini', () => {
  it('menerima format key lama AIza dan format auth key baru AQ.', () => {
    expect(kunciGeminiValid('AIzaSyContoh')).toBe(true);
    expect(kunciGeminiValid('AQ.Ab8Contoh')).toBe(true);
    expect(kunciGeminiValid('user_bukan_key_google')).toBe(false);
  });

  it('menolak key yang bukan format Google AI Studio tanpa memanggil jaringan', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'user_bukan_key_google');
    await expect(panggilGeminiTts('Halo, ini tes.', 'docu')).rejects.toMatchObject({
      pesanAman: PESAN_AUDIO_BELUM_SIAP,
    });
  });

  it('membungkus PCM 24 kHz mono 16-bit menjadi WAV yang valid', () => {
    const wav = bungkusWav(PCM);
    expect(wav.subarray(0, 4).toString()).toBe('RIFF');
    expect(wav.readUInt32LE(4)).toBe(36 + PCM.length);
    expect(wav.subarray(8, 12).toString()).toBe('WAVE');
    expect(wav.readUInt16LE(20)).toBe(1);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(24_000);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.subarray(44)).toEqual(PCM);
  });

  it('mengambil inlineData PCM dari balasan Gemini', () => {
    const wav = uraikanAudioGemini(balasanAudio(PCM.toString('base64')));
    expect(wav.subarray(0, 4).toString()).toBe('RIFF');
    expect(wav.subarray(44)).toEqual(PCM);
  });

  it('tidak membungkus ulang audio yang sudah WAV', () => {
    const wav = uraikanAudioGemini(balasanAudio(PCM.toString('base64'), 'audio/wav'));
    expect(wav).toEqual(PCM);
  });

  it('menolak balasan tanpa inlineData audio', () => {
    expect(() => uraikanAudioGemini({ candidates: [] })).toThrow(ErrorAudioAi);
  });

  it('menyusun prompt yang tidak membaca instruksi dan memuat transkrip', () => {
    const prompt = susunPromptTts('Di sebuah kelas, seorang siswa bertanya.', 'docu');
    expect(prompt).toContain('Synthesize Indonesian speech only.');
    expect(prompt).toContain('Do not read these instructions');
    expect(prompt).toContain('<TRANSCRIPT>');
    expect(prompt).toContain('Di sebuah kelas, seorang siswa bertanya.');
    expect(prompt).toContain('narator dokumenter');
  });

  it('menyebut dua pembicara untuk gaya dialog', () => {
    const prompt = susunPromptTts('GURU: Coba bayangkan.\nSISWA: Kenapa?', 'dialog');
    expect(prompt).toContain('GURU dan SISWA');
  });

  it('membuat hash cache yang stabil tetapi berbeda per gaya', () => {
    expect(hashAudio('teks yang sama', 'docu')).toBe(hashAudio(' teks yang sama ', 'docu'));
    expect(hashAudio('teks yang sama', 'docu')).not.toBe(hashAudio('teks yang sama', 'podcast'));
  });
});
