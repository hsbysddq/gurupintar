import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ambilHasil,
  ambilMateriGuru,
  ambilMateriSiswa,
  ambilSesi,
  bagikanMateri,
  bukaSesi,
  buatMateri,
  ErrorApi,
  kirimJawaban,
  PESAN_GAGAL_KONEKSI,
  tutupSesi,
  ubahMateri,
} from '@/lib/api-klien';
import type { IsiMateri } from '@/lib/tipe';

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

  it('melempar ulang error pembatalan tanpa mengubahnya menjadi ErrorApi', async () => {
    const pengendali = new AbortController();
    stubFetch(async () => {
      pengendali.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    await expect(ambilHasil('s1', pengendali.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('ambilHasil meneruskan signal dan meng-encode id sesi', async () => {
    const palsu = stubFetch(async () => Response.json({}));
    const pengendali = new AbortController();
    await ambilHasil('a b', pengendali.signal);
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/hasil?sesi=a%20b');
    expect(palsu.mock.calls[0][1]?.signal).toBe(pengendali.signal);
  });

  it('bukaSesi dan tutupSesi mengirim POST dengan body JSON', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    await bukaSesi();
    await tutupSesi('s1');
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/sesi');
    expect(palsu.mock.calls[0][1]?.body).toBe('{}');
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/sesi/tutup');
    expect(JSON.parse(palsu.mock.calls[1][1]?.body as string)).toEqual({ sesiId: 's1' });
  });

  it('fungsi materi memakai URL, metode, dan body yang benar', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    const isi = { judul: 'Judul' } as IsiMateri;
    await ambilMateriGuru('s 1');
    await buatMateri({ sesiId: 's1', ganti: true });
    await ubahMateri('m1', 3, isi);
    await bagikanMateri('s1');
    await ambilMateriSiswa('s1', 'a b');

    const panggilan = palsu.mock.calls.map(([url, init]) => [url, init?.method, init?.body]);
    expect(panggilan).toEqual([
      ['/api/guru/materi?sesi=s%201', undefined, undefined],
      ['/api/guru/materi', 'POST', JSON.stringify({ sesiId: 's1', ganti: true })],
      ['/api/guru/materi', 'PATCH', JSON.stringify({ id: 'm1', versi: 3, isi })],
      ['/api/guru/materi/bagikan', 'POST', JSON.stringify({ sesiId: 's1' })],
      ['/api/materi?sesi=s1&siswa=a%20b', undefined, undefined],
    ]);
  });
});
