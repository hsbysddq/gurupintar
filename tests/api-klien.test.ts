import { afterEach, describe, expect, it, vi } from 'vitest';
import { ambilSesi, ErrorApi, kirimJawaban, PESAN_GAGAL_KONEKSI } from '@/lib/api-klien';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: () => Promise<Response>) {
  const palsu = vi.fn<typeof fetch>(impl);
  vi.stubGlobal('fetch', palsu);
  return palsu;
}

async function tangkap(janji: Promise<unknown>): Promise<ErrorApi> {
  try {
    await janji;
  } catch (err) {
    if (err instanceof ErrorApi) return err;
    throw err;
  }
  throw new Error('Seharusnya melempar ErrorApi');
}

describe('api-klien', () => {
  it('mengembalikan data JSON jika sukses dan meng-encode kode', async () => {
    const palsu = stubFetch(async () => Response.json({ sesi: { id: 'x' }, siswa: [] }));
    await expect(ambilSesi('A7 K2P')).resolves.toEqual({ sesi: { id: 'x' }, siswa: [] });
    expect(palsu.mock.calls[0][0]).toBe('/api/sesi?kode=A7%20K2P');
  });

  it('melempar ErrorApi dengan pesan dari server', async () => {
    stubFetch(async () => Response.json({ error: 'Kuis ini sudah ditutup.' }, { status: 409 }));
    const err = await tangkap(ambilSesi('RIW001'));
    expect(err.status).toBe(409);
    expect(err.message).toBe('Kuis ini sudah ditutup.');
  });

  it('memakai pesan umum jika respons error bukan JSON', async () => {
    stubFetch(async () => new Response('Internal Server Error', { status: 500 }));
    const err = await tangkap(ambilSesi('A7K2P'));
    expect(err.status).toBe(500);
    expect(err.message).toMatch(/Coba lagi/);
  });

  it('status 0 jika jaringan gagal', async () => {
    stubFetch(async () => { throw new TypeError('Failed to fetch'); });
    const err = await tangkap(kirimJawaban({ sesiId: 'a', siswaId: 'b', jawaban: [] }));
    expect(err.status).toBe(0);
    expect(err.message).toBe(PESAN_GAGAL_KONEKSI);
  });

  it('POST mengirim body JSON dengan header yang benar', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    const body = { sesiId: 'a', siswaId: 'b', jawaban: [{ soalId: 'c', pilihan: 'A' as const }] };
    await kirimJawaban(body);
    const [url, init] = palsu.mock.calls[0];
    expect(url).toBe('/api/jawaban');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init?.body as string)).toEqual(body);
  });
});
