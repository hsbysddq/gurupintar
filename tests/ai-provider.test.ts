import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ambilDaftarModelAi,
  buatKlienCommandCode,
  grupModel,
  pastikanModelAi,
  petakanModelAi,
  resetCacheModelAi,
} from '@/lib/server/ai-provider';

const MODEL_LIST = {
  object: 'list',
  data: [
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      context_length: 200000,
      supported_endpoints: ['/messages'],
    },
    {
      id: 'deepseek/deepseek-v4.1-flash',
      name: 'DeepSeek V4.1 Flash',
      context_length: 1000000,
      supported_endpoints: ['/chat/completions', '/responses'],
    },
    {
      id: 'tidak-didukung',
      name: 'Tidak didukung',
      context_length: 1000,
      supported_endpoints: ['/systemone'],
    },
  ],
};

function responsJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  resetCacheModelAi();
  vi.stubEnv('COMMAND_CODE_API_KEY', 'kunci-uji');
});

afterEach(() => {
  resetCacheModelAi();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('petakanModelAi', () => {
  it('menyaring model yang tidak mendukung chat/messages dan mengelompokkannya', () => {
    const hasil = petakanModelAi(MODEL_LIST);
    expect(hasil.map((m) => m.id)).toEqual(['claude-haiku-4-5-20251001', 'deepseek/deepseek-v4.1-flash']);
    expect(hasil[0]).toMatchObject({ grup: 'Anthropic', contextLength: 200000 });
    expect(hasil[1]).toMatchObject({ grup: 'DeepSeek', contextLength: 1000000 });
  });

  it('aman untuk bentuk data yang tidak dikenal', () => {
    expect(petakanModelAi(null)).toEqual([]);
    expect(petakanModelAi({ data: 'bukan array' })).toEqual([]);
    expect(petakanModelAi({ data: [{}, { id: '' }] })).toEqual([]);
  });
});

describe('grupModel', () => {
  it('memberi grup yang stabil untuk id yang dikenal', () => {
    expect(grupModel('claude-sonnet-5')).toBe('Anthropic');
    expect(grupModel('gpt-6-luna')).toBe('OpenAI');
    expect(grupModel('google/gemini-3.1-flash-lite')).toBe('Google');
    expect(grupModel('Qwen/Qwen3.8-Flash')).toBe('Qwen');
    expect(grupModel('model-asing')).toBe('Lainnya');
  });
});

describe('ambilDaftarModelAi', () => {
  it('mengambil katalog dari Command Code dan menyimpan cache', async () => {
    const fetchPalsu = vi.fn<typeof fetch>(async () => responsJson(MODEL_LIST));
    vi.stubGlobal('fetch', fetchPalsu);

    const pertama = await ambilDaftarModelAi();
    const kedua = await ambilDaftarModelAi();

    expect(pertama).toHaveLength(2);
    expect(kedua).toEqual(pertama);
    expect(fetchPalsu).toHaveBeenCalledTimes(1);
    expect(fetchPalsu.mock.calls[0][0]).toBe('https://api.commandcode.ai/provider/v1/models');
  });

  it('memvalidasi model yang ada dan menolak yang tidak ada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => responsJson(MODEL_LIST)));
    expect(await pastikanModelAi('deepseek/deepseek-v4.1-flash')).toBe(true);
    expect(await pastikanModelAi('model-tidak-ada')).toBe(false);
  });

  it('kembali ke model default jika katalog gagal dimuat', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => responsJson({ error: 'gagal' }, 500)));
    const hasil = await ambilDaftarModelAi();
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil[0].id).toBe('deepseek/deepseek-v4.1-flash');
  });
});

describe('buatKlienCommandCode', () => {
  it('mengirim model non-Claude ke /chat/completions dengan system prompt', async () => {
    const fetchPalsu = vi.fn<typeof fetch>(async () =>
      responsJson({ choices: [{ message: { content: '{"ok":true}' } }] }),
    );
    vi.stubGlobal('fetch', fetchPalsu);

    const klien = buatKlienCommandCode('kunci-uji');
    const hasil = await klien.messages.create({
      model: 'deepseek/deepseek-v4.1-flash',
      max_tokens: 2000,
      system: 'Instruksi',
      messages: [{ role: 'user', content: 'Halo' }],
    });

    expect(fetchPalsu).toHaveBeenCalledTimes(1);
    const [url, init] = fetchPalsu.mock.calls[0];
    expect(url).toBe('https://api.commandcode.ai/provider/v1/chat/completions');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      model: 'deepseek/deepseek-v4.1-flash',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: 'Instruksi' },
        { role: 'user', content: 'Halo' },
      ],
    });
    expect(hasil.content[0]).toMatchObject({ type: 'text', text: '{"ok":true}' });
  });

  it('mengirim model Claude ke /messages', async () => {
    const fetchPalsu = vi.fn<typeof fetch>(async () =>
      responsJson({ content: [{ type: 'text', text: 'halo', citations: null }] }),
    );
    vi.stubGlobal('fetch', fetchPalsu);

    const klien = buatKlienCommandCode('kunci-uji');
    const hasil = await klien.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: 'Instruksi',
      messages: [{ role: 'user', content: 'Halo' }],
    });

    const [url, init] = fetchPalsu.mock.calls[0];
    expect(url).toBe('https://api.commandcode.ai/provider/v1/messages');
    expect(init?.headers).toMatchObject({ 'anthropic-version': '2023-06-01' });
    expect(JSON.parse(init?.body as string)).toMatchObject({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: 'Instruksi',
    });
    expect(hasil.content[0]).toMatchObject({ type: 'text', text: 'halo' });
  });

  it('meneruskan pesan error dari provider', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => responsJson({ error: { message: 'Model tidak tersedia.' } }, 400)),
    );
    const klien = buatKlienCommandCode('kunci-uji');
    await expect(
      klien.messages.create({
        model: 'deepseek/deepseek-v4.1-flash',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Halo' }],
      }),
    ).rejects.toThrow('Model tidak tersedia.');
  });
});
