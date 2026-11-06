import { describe, expect, it } from 'vitest';
import { DAFTAR_GAYA_AUDIO, GAYA_AUDIO, INSTRUKSI_GAYA_AUDIO, ambilGayaAudio } from '@/lib/gaya-audio';

describe('gaya audio', () => {
  it('menyediakan empat gaya A–D dengan kode unik', () => {
    expect(DAFTAR_GAYA_AUDIO).toHaveLength(4);
    expect(DAFTAR_GAYA_AUDIO.map((g) => g.kode)).toEqual(['A', 'B', 'C', 'D']);
    expect(new Set(DAFTAR_GAYA_AUDIO.map((g) => g.id)).size).toBe(4);
  });

  it('memakai Docu Vlog sebagai fallback dan punya aturan untuk setiap gaya', () => {
    expect(ambilGayaAudio('tidak-ada')).toBe(GAYA_AUDIO.docu);
    expect(ambilGayaAudio('dialog').nama).toBe('Dua Sahabat');
    for (const gaya of DAFTAR_GAYA_AUDIO) {
      expect(INSTRUKSI_GAYA_AUDIO[gaya.id].length).toBeGreaterThan(50);
    }
  });
});
