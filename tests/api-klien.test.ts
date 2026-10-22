import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ambilDaftarKelas,
  ambilDaftarSesi,
  ambilDaftarTopik,
  ambilDetailTopik,
  ambilHasil,
  ambilDetailKelasSiswa,
  ambilKelasSiswa,
  ambilMateriGuru,
  ambilMateriSiswa,
  ambilPendampingan,
  bagikanMateri,
  buatKelas,
  buatMateri,
  bukaSesi,
  bukaSesiBanyak,
  daftarGuru,
  daftarSiswa,
  ErrorApi,
  gabungKelas,
  gabungSesi,
  hapusTopik,
  keluar,
  keluarkanSiswa,
  kirimJawaban,
  masuk,
  PESAN_GAGAL_KONEKSI,
  simpanTopik,
  tutupSesi,
  ubahKelas,
  ubahMateri,
  ubahTopik,
} from '@/lib/api-klien';
import type { IsiMateri } from '@/lib/tipe';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
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

describe('api-klien siswa', () => {
  it('gabungSesi memakai POST dan mengirim kode di body', async () => {
    const palsu = stubFetch(async () => Response.json({ sesi: { id: 'x' } }));
    await expect(gabungSesi('A7 K2P')).resolves.toEqual({ sesi: { id: 'x' } });
    expect(palsu.mock.calls[0][0]).toBe('/api/sesi');
    expect(palsu.mock.calls[0][1]?.method).toBe('POST');
    expect(JSON.parse(palsu.mock.calls[0][1]?.body as string)).toEqual({ kode: 'A7 K2P' });
  });

  it('melempar ErrorApi dengan pesan dari server', async () => {
    stubFetch(async () => Response.json({ error: 'Kuis ini sudah ditutup.' }, { status: 409 }));
    const err = await tangkap(gabungSesi('RIW001'));
    expect(err.status).toBe(409);
    expect(err.message).toBe('Kuis ini sudah ditutup.');
  });

  it('ambilKelasSiswa dan gabungKelas memakai rute /api/siswa/kelas', async () => {
    const palsu = stubFetch(async () => Response.json([]));
    const pengendali = new AbortController();
    await ambilKelasSiswa(pengendali.signal);
    await gabungKelas('KEL7A');
    expect(palsu.mock.calls[0][0]).toBe('/api/siswa/kelas');
    expect(palsu.mock.calls[0][1]?.method).toBeUndefined();
    expect(palsu.mock.calls[0][1]?.signal).toBe(pengendali.signal);
    expect(palsu.mock.calls[1][0]).toBe('/api/siswa/kelas');
    expect(palsu.mock.calls[1][1]?.method).toBe('POST');
    expect(JSON.parse(palsu.mock.calls[1][1]?.body as string)).toEqual({ kode: 'KEL7A' });
  });

  it('ambilDetailKelasSiswa menggabungkan daftar kelas dan riwayat sesi', async () => {
    stubFetch(async (url) =>
      String(url).includes('/sesi')
        ? Response.json([{ id: 's1', statusMateri: 'disiapkan' }])
        : Response.json([{ id: 'k1', nama: 'Kelas 7A' }]),
    );
    const hasil = await ambilDetailKelasSiswa('k1');
    expect(hasil.kelas.id).toBe('k1');
    expect(hasil.sesi).toEqual([{ id: 's1', statusMateri: 'disiapkan' }]);
  });

  it('memakai pesan umum jika respons error bukan JSON', async () => {
    stubFetch(async () => new Response('Internal Server Error', { status: 500 }));
    const err = await tangkap(gabungSesi('A7K2P'));
    expect(err.status).toBe(500);
    expect(err.message).toMatch(/Coba lagi/);
  });

  it('status 0 jika jaringan gagal', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    const err = await tangkap(kirimJawaban({ sesiId: 'a', jawaban: [] }));
    expect(err.status).toBe(0);
    expect(err.message).toBe(PESAN_GAGAL_KONEKSI);
  });

  it('POST mengirim body JSON tanpa siswaId dan dengan cookie same-origin', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    const body = { sesiId: 'a', jawaban: [{ soalId: 'c', pilihan: 'A' as const }] };
    await kirimJawaban(body);
    const [url, init] = palsu.mock.calls[0];
    expect(url).toBe('/api/jawaban');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('same-origin');
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
});

describe('api-klien guru', () => {
  it('bukaSesi dan tutupSesi mengirim POST dengan body JSON', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    await bukaSesi({ kelasId: 'k1', topikId: 't1' });
    await tutupSesi('s1');
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/sesi');
    expect(JSON.parse(palsu.mock.calls[0][1]?.body as string)).toEqual({ kelasId: 'k1', topikId: 't1' });
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/sesi/tutup');
    expect(JSON.parse(palsu.mock.calls[1][1]?.body as string)).toEqual({ sesiId: 's1' });
  });

  it('ambilDaftarSesi memakai query kelas hanya jika diberikan', async () => {
    const palsu = stubFetch(async () => Response.json([]));
    await ambilDaftarSesi();
    await ambilDaftarSesi('k 1');
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/sesi');
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/sesi?kelas=k%201');
  });

  it('bukaSesiBanyak memakai rute batch dan mengirim daftar kelas', async () => {
    const palsu = stubFetch(async () => Response.json({ sesi: [], gagal: [] }));
    await bukaSesiBanyak({ kelasIds: ['k1', 'k2'], topikId: 't1' });
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/sesi/banyak');
    expect(palsu.mock.calls[0][1]?.method).toBe('POST');
    expect(JSON.parse(palsu.mock.calls[0][1]?.body as string)).toEqual({
      kelasIds: ['k1', 'k2'],
      topikId: 't1',
    });
  });

  it('kelas memakai GET, POST, dan PATCH yang benar', async () => {
    const palsu = stubFetch(async () => Response.json([]));
    await ambilDaftarKelas();
    await buatKelas({ nama: 'Kelas 7B', mapel: 'Matematika' });
    await ubahKelas({ id: 'k1', nama: 'Kelas 7C', arsip: false });
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/kelas');
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/kelas');
    expect(palsu.mock.calls[1][1]?.method).toBe('POST');
    expect(palsu.mock.calls[2][0]).toBe('/api/guru/kelas');
    expect(palsu.mock.calls[2][1]?.method).toBe('PATCH');
    expect(JSON.parse(palsu.mock.calls[2][1]?.body as string)).toEqual({
      id: 'k1',
      nama: 'Kelas 7C',
      arsip: false,
    });
  });

  it('keluarkanSiswa memakai DELETE dan mengirim kedua id', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    await keluarkanSiswa({ kelasId: 'k1', siswaId: 's1' });
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/kelas/siswa');
    expect(palsu.mock.calls[0][1]?.method).toBe('DELETE');
    expect(JSON.parse(palsu.mock.calls[0][1]?.body as string)).toEqual({ kelasId: 'k1', siswaId: 's1' });
  });

  it('fungsi materi memakai URL, metode, dan body yang benar', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    const isi = { judul: 'Judul' } as IsiMateri;
    await ambilMateriGuru('s 1');
    await buatMateri({ sesiId: 's1', ganti: true });
    await ubahMateri('m1', 3, isi);
    await bagikanMateri('s1');
    await ambilMateriSiswa('s1');

    const panggilan = palsu.mock.calls.map(([url, init]) => [url, init?.method, init?.body]);
    expect(panggilan).toEqual([
      ['/api/guru/materi?sesi=s%201', undefined, undefined],
      ['/api/guru/materi', 'POST', JSON.stringify({ sesiId: 's1', ganti: true })],
      ['/api/guru/materi', 'PATCH', JSON.stringify({ id: 'm1', versi: 3, isi })],
      ['/api/guru/materi/bagikan', 'POST', JSON.stringify({ sesiId: 's1' })],
      ['/api/materi?sesi=s1', undefined, undefined],
    ]);
  });

  it('ambilPendampingan memakai query kelas dan signal', async () => {
    const palsu = stubFetch(async () => Response.json({ perluPendampingan: [], kemajuan: [] }));
    const pengendali = new AbortController();
    await expect(ambilPendampingan(undefined, pengendali.signal)).resolves.toEqual({
      perluPendampingan: [],
      kemajuan: [],
    });
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/pendampingan');
    expect(palsu.mock.calls[0][1]?.signal).toBe(pengendali.signal);
    await ambilPendampingan('k1');
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/pendampingan?kelas=k1');
  });
});

describe('fungsi topik (PRD F-10)', () => {
  it('ambilDaftarTopik memakai GET dan simpanTopik memakai POST dengan body', async () => {
    const palsu = stubFetch(async () => Response.json([]));
    await ambilDaftarTopik();
    const body = { nama: 'Topik', capaianPembelajaran: 'Capaian uji', soal: [] };
    await simpanTopik(body);
    expect(palsu.mock.calls[0][0]).toBe('/api/guru/topik');
    expect(palsu.mock.calls[0][1]?.method).toBeUndefined();
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/topik');
    expect(palsu.mock.calls[1][1]?.method).toBe('POST');
    expect(JSON.parse(palsu.mock.calls[1][1]?.body as string)).toEqual(body);
  });

  it('detail, ubah, dan hapus topik memakai rute yang benar', async () => {
    const palsu = stubFetch(async () => Response.json({ ok: true }));
    const pengendali = new AbortController();
    await ambilDetailTopik('t 1', pengendali.signal);
    const body = {
      id: 't1',
      nama: 'Topik',
      capaianPembelajaran: 'Capaian uji',
      soal: [],
    } as Parameters<typeof ubahTopik>[0];
    await ubahTopik(body);
    await hapusTopik('t1');

    expect(palsu.mock.calls[0][0]).toBe('/api/guru/topik/detail?topik=t%201');
    expect(palsu.mock.calls[0][1]?.signal).toBe(pengendali.signal);
    expect(palsu.mock.calls[1][0]).toBe('/api/guru/topik');
    expect(palsu.mock.calls[1][1]?.method).toBe('PATCH');
    expect(JSON.parse(palsu.mock.calls[1][1]?.body as string)).toEqual(body);
    expect(palsu.mock.calls[2][0]).toBe('/api/guru/topik');
    expect(palsu.mock.calls[2][1]?.method).toBe('DELETE');
    expect(JSON.parse(palsu.mock.calls[2][1]?.body as string)).toEqual({ id: 't1' });
  });
});

describe('fungsi autentikasi', () => {
  it('masuk, daftarSiswa, daftarGuru, dan keluar memakai rute yang benar', async () => {
    const palsu = stubFetch(async () => Response.json({ peran: 'guru', ok: true }));
    await masuk({ email: 'a@b.c', password: 'rahasia123' });
    await daftarSiswa({ nama: 'Budi', email: 'a@b.c', password: 'rahasia123' });
    await daftarGuru({ nama: 'Bu Rina', email: 'g@b.c', password: 'rahasia123', kodeUndangan: 'ABC' });
    await keluar();

    const panggilan = palsu.mock.calls.map(([url, init]) => [url, init?.method]);
    expect(panggilan).toEqual([
      ['/api/auth/masuk', 'POST'],
      ['/api/auth/daftar-siswa', 'POST'],
      ['/api/auth/daftar-guru', 'POST'],
      ['/api/auth/keluar', 'POST'],
    ]);
  });
});
