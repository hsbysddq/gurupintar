import 'server-only';
import type Anthropic from '@anthropic-ai/sdk';
import type { ModelAi } from '@/lib/tipe';

const BASE_URL = (process.env.COMMAND_CODE_BASE_URL ?? 'https://api.commandcode.ai/provider/v1').replace(/\/+$/, '');

export const MODEL_DEFAULT =
  process.env.AI_MODEL?.trim() ||
  process.env.COMMAND_CODE_MODEL?.trim() ||
  'deepseek/deepseek-v4.1-flash';

const TTL_MODEL_MS = 10 * 60_000;

export interface KlienAi {
  messages: {
    create(
      body: Anthropic.MessageCreateParamsNonStreaming,
      options?: { signal?: AbortSignal; timeout?: number },
    ): PromiseLike<Anthropic.Message>;
  };
}

let cacheModel: { waktu: number; data: ModelAi[] } | null = null;

function kunciApi(): string {
  return process.env.COMMAND_CODE_API_KEY?.trim() ?? '';
}

function namaDariId(id: string): string {
  if (id === MODEL_DEFAULT) return 'DeepSeek V4.1 Flash';
  const bagian = id.split('/').pop() ?? id;
  return bagian.replaceAll('-', ' ');
}

/** Mengelompokkan id model untuk `<optgroup>` di UI. */
export function grupModel(id: string): string {
  if (id.startsWith('claude')) return 'Anthropic';
  if (id.startsWith('gpt')) return 'OpenAI';
  if (id.startsWith('google/')) return 'Google';
  if (id.startsWith('deepseek/')) return 'DeepSeek';
  if (id.startsWith('Qwen/')) return 'Qwen';
  if (id.startsWith('z-ai/') || id.startsWith('zai-org/')) return 'GLM';
  if (id.startsWith('MiniMaxAI/') || id.startsWith('minimax/')) return 'MiniMax';
  if (id.startsWith('moonshotai/')) return 'Kimi';
  if (id.startsWith('xai/')) return 'xAI';
  if (id.startsWith('meta/')) return 'Meta';
  if (id.startsWith('mistral/')) return 'Mistral';
  if (id.startsWith('stepfun/')) return 'StepFun';
  if (id.startsWith('tencent/')) return 'Tencent';
  if (id.startsWith('nvidia/')) return 'NVIDIA';
  if (id.startsWith('xiaomi/')) return 'Xiaomi';
  if (id.startsWith('inclusionai/')) return 'Ling';
  if (id.startsWith('thinkingmachines/')) return 'Inkling';
  if (id.startsWith('meituan/')) return 'LongCat';
  if (id.startsWith('sakana/')) return 'Sakana';
  if (id.startsWith('ornith/')) return 'Ornith';
  if (id.startsWith('poolside/') || id.startsWith('reflection/') || id.startsWith('stealth/')) return 'Eksperimental';
  return 'Lainnya';
}

/** Data mentah `/provider/v1/models` → daftar yang aman dikirim ke browser. */
export function petakanModelAi(data: unknown): ModelAi[] {
  if (typeof data !== 'object' || data === null || !('data' in data) || !Array.isArray(data.data)) return [];
  const hasil: ModelAi[] = [];
  for (const baris of data.data as unknown[]) {
    if (typeof baris !== 'object' || baris === null) continue;
    const model = baris as {
      id?: unknown;
      name?: unknown;
      context_length?: unknown;
      supported_endpoints?: unknown;
    };
    if (typeof model.id !== 'string' || !model.id.trim()) continue;
    const endpoint = Array.isArray(model.supported_endpoints)
      ? model.supported_endpoints.filter((e): e is string => typeof e === 'string')
      : [];
    if (endpoint.length > 0 && !endpoint.includes('/chat/completions') && !endpoint.includes('/messages')) continue;
    hasil.push({
      id: model.id,
      name: typeof model.name === 'string' && model.name.trim() ? model.name : namaDariId(model.id),
      grup: grupModel(model.id),
      contextLength: typeof model.context_length === 'number' ? model.context_length : null,
    });
  }
  return hasil.sort((a, b) => a.grup.localeCompare(b.grup, 'id') || a.name.localeCompare(b.name, 'id'));
}

export function resetCacheModelAi() {
  cacheModel = null;
}

/** Daftar model live dari Command Code. Saat API key belum ada, pakai fallback Anthropic. */
export async function ambilDaftarModelAi(): Promise<ModelAi[]> {
  const key = kunciApi();
  if (!key) {
    const modelAnthropic = process.env.ANTHROPIC_MODEL?.trim();
    return modelAnthropic
      ? [{ id: modelAnthropic, name: modelAnthropic, grup: 'Anthropic', contextLength: null }]
      : [];
  }

  if (cacheModel && Date.now() - cacheModel.waktu < TTL_MODEL_MS) return cacheModel.data;

  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Daftar model gagal dimuat (${res.status}).`);
    const data = petakanModelAi((await res.json()) as unknown);
    if (data.length > 0) {
      cacheModel = { waktu: Date.now(), data };
      return data;
    }
  } catch {
    // Jangan gagalkan fitur hanya karena katalog model sedang tidak bisa dihubungi.
  }

  return [
    {
      id: MODEL_DEFAULT,
      name: namaDariId(MODEL_DEFAULT),
      grup: grupModel(MODEL_DEFAULT),
      contextLength: null,
    },
  ];
}

export async function pastikanModelAi(model: string): Promise<boolean> {
  const daftar = await ambilDaftarModelAi();
  return daftar.some((m) => m.id === model);
}

function teksDariKonten(konten: unknown): string {
  if (typeof konten === 'string') return konten;
  if (!Array.isArray(konten)) return '';
  return konten
    .map((bagian) => {
      if (typeof bagian !== 'object' || bagian === null) return '';
      const tipe = 'type' in bagian ? bagian.type : '';
      if (tipe === 'text' && 'text' in bagian && typeof bagian.text === 'string') return bagian.text;
      if (tipe === 'document') {
        throw new Error('Provider API Command Code tidak menerima lampiran PDF; ekstrak teks PDF lebih dulu.');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function teksResponsOpenAi(data: unknown): string {
  if (typeof data !== 'object' || data === null || !('choices' in data) || !Array.isArray(data.choices)) return '';
  const pilihan = data.choices[0] as { message?: { content?: unknown } } | undefined;
  const konten = pilihan?.message?.content;
  if (typeof konten === 'string') return konten;
  if (Array.isArray(konten)) {
    return konten
      .map((bagian) => {
        if (typeof bagian === 'string') return bagian;
        if (typeof bagian === 'object' && bagian !== null && 'text' in bagian && typeof bagian.text === 'string') {
          return bagian.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('');
  }
  return '';
}

/**
 * Adapter agar provider OpenAI-compatible/Anthropic-compatible Command Code bisa dipakai
 * lewat antarmuka `KlienAi` yang sudah dipakai fitur materi.
 */
export function buatKlienCommandCode(apiKey = kunciApi()): KlienAi {
  if (!apiKey) throw new Error('COMMAND_CODE_API_KEY belum diisi.');
  const baseURL = (process.env.COMMAND_CODE_BASE_URL ?? BASE_URL).replace(/\/+$/, '');

  return {
    messages: {
      async create(body, opsi) {
        const model = body.model;
        const anthropicWire = model.startsWith('claude');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        };

        let url: string;
        let muatan: Record<string, unknown>;

        if (anthropicWire) {
          url = `${baseURL}/messages`;
          headers['anthropic-version'] = '2023-06-01';
          muatan = {
            model,
            max_tokens: body.max_tokens,
            ...(body.system ? { system: body.system } : {}),
            messages: body.messages.map((m) => ({ role: m.role, content: teksDariKonten(m.content) })),
          };
        } else {
          url = `${baseURL}/chat/completions`;
          const pesan: { role: string; content: string }[] = [];
          if (body.system) pesan.push({ role: 'system', content: teksDariKonten(body.system) });
          for (const m of body.messages) pesan.push({ role: m.role, content: teksDariKonten(m.content) });
          muatan = { model, max_tokens: body.max_tokens, messages: pesan };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(muatan),
          signal: opsi?.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          let pesan = `Command Code API gagal (${res.status}).`;
          try {
            const galat = (await res.json()) as { error?: { message?: string } };
            if (galat.error?.message) pesan = galat.error.message;
          } catch {
            // Pakai pesan status di atas.
          }
          throw new Error(pesan);
        }

        const data = (await res.json()) as unknown;
        if (anthropicWire) return data as Anthropic.Message;

        const teks = teksResponsOpenAi(data);
        if (!teks) throw new Error('Model tidak mengembalikan teks.');
        return {
          id: 'command-code',
          type: 'message',
          role: 'assistant',
          model,
          content: [{ type: 'text', text: teks, citations: null }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        } as unknown as Anthropic.Message;
      },
    },
  };
}
