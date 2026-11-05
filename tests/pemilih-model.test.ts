import { describe, expect, it } from 'vitest';
import { formatKonteks, kelompokkanModel, saringModel } from '@/lib/pemilih-model';
import type { ModelAi } from '@/lib/tipe';

const model: ModelAi[] = [
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', grup: 'Anthropic', contextLength: 1_000_000 },
  { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', grup: 'DeepSeek', contextLength: 128_000 },
  { id: 'gpt-5', name: 'GPT-5', grup: 'OpenAI', contextLength: 200_000 },
];

describe('saringModel', () => {
  it('mencari berdasarkan nama, id, atau provider tanpa peduli huruf besar-kecil', () => {
    expect(saringModel(model, 'sonnet').map((m) => m.id)).toEqual(['claude-sonnet-5']);
    expect(saringModel(model, 'DEEPSEEK').map((m) => m.id)).toEqual(['deepseek/deepseek-v4.1-flash']);
    expect(saringModel(model, 'openai').map((m) => m.id)).toEqual(['gpt-5']);
  });

  it('mengembalikan semua model jika pencarian kosong', () => {
    expect(saringModel(model, '   ')).toEqual(model);
  });
});

describe('kelompokkanModel', () => {
  it('mengelompokkan model dan mempertahankan indeks datar untuk navigasi keyboard', () => {
    const grup = kelompokkanModel(model);
    expect(grup.map((g) => g.nama)).toEqual(['Anthropic', 'DeepSeek', 'OpenAI']);
    expect(grup[0].opsi[0]).toMatchObject({ indeks: 0, model: { id: 'claude-sonnet-5' } });
    expect(grup[2].opsi[0]).toMatchObject({ indeks: 2, model: { id: 'gpt-5' } });
  });
});

describe('formatKonteks', () => {
  it('meringkas ukuran konteks', () => {
    expect(formatKonteks(1_000_000)).toBe('1 jt');
    expect(formatKonteks(200_000)).toBe('200 rb');
    expect(formatKonteks(1_048_576)).toBe('1,0 jt');
    expect(formatKonteks(null)).toBeNull();
    expect(formatKonteks(0)).toBeNull();
  });
});
