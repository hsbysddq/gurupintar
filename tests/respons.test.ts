import { describe, expect, it } from 'vitest';
import {
  PESAN_ERROR_UMUM,
  PESAN_SESI_DITUTUP,
  PESAN_SESI_TIDAK_ADA,
  petakanErrorDb,
  responsError,
  responsOk,
} from '@/lib/server/respons';

describe('responsOk', () => {
  it('mengembalikan JSON dengan status 200 secara bawaan', async () => {
    const res = responsOk({ ok: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('memakai status yang diberikan', () => {
    expect(responsOk({ id: 'x' }, 201).status).toBe(201);
  });
});

describe('responsError', () => {
  it('membungkus pesan dalam properti error', async () => {
    const res = responsError('Kode kelas tidak ditemukan.', 404);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Kode kelas tidak ditemukan.' });
  });
});

describe('petakanErrorDb', () => {
  it('SESI_TIDAK_ADA menjadi 404', async () => {
    const res = petakanErrorDb({ message: 'SESI_TIDAK_ADA', code: 'P0001' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: PESAN_SESI_TIDAK_ADA });
  });

  it('SESI_DITUTUP menjadi 409 dengan pesan PRD AC-1.4', async () => {
    const res = petakanErrorDb({ message: 'SESI_DITUTUP', code: 'P0001' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Kuis ini sudah ditutup.' });
    expect(PESAN_SESI_DITUTUP).toBe('Kuis ini sudah ditutup.');
  });

  it.each([
    { message: 'duplicate key value violates unique constraint' },
    new Error('koneksi putus'),
    'bukan objek',
    null,
    undefined,
  ])('error lain menjadi 500 tanpa membocorkan detail: %o', async (err) => {
    const res = petakanErrorDb(err);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: PESAN_ERROR_UMUM });
  });
});
