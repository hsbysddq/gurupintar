import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ambilIdentitas,
  berlanggananIdentitas,
  hapusIdentitas,
  simpanFormatLokal,
  simpanIdentitas,
  uraiIdentitas,
  type IdentitasSiswa,
} from '@/lib/sesi-lokal';

const IDENTITAS: IdentitasSiswa = {
  sesiId: 'sesi-1',
  kodeKelas: 'A7K2P',
  siswaId: 'siswa-1',
  namaSiswa: 'Budi Santoso',
  format: null,
};

function penyimpananPalsu(): Storage {
  const isi = new Map<string, string>();
  return {
    get length() { return isi.size; },
    clear: () => isi.clear(),
    getItem: (k) => isi.get(k) ?? null,
    key: (i) => [...isi.keys()][i] ?? null,
    removeItem: (k) => { isi.delete(k); },
    setItem: (k, v) => { isi.set(k, v); },
  };
}

beforeEach(() => {
  const target = new EventTarget();
  vi.stubGlobal('window', {
    localStorage: penyimpananPalsu(),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sesi-lokal', () => {
  it('null jika belum ada identitas', () => {
    expect(ambilIdentitas()).toBeNull();
  });

  it('menyimpan dan membaca identitas', () => {
    simpanIdentitas(IDENTITAS);
    expect(ambilIdentitas()).toEqual(IDENTITAS);
  });

  it('menyimpan format tanpa mengubah data lain', () => {
    simpanIdentitas(IDENTITAS);
    simpanFormatLokal('audio');
    expect(ambilIdentitas()).toEqual({ ...IDENTITAS, format: 'audio' });
  });

  it('simpanFormatLokal tidak membuat identitas baru jika belum ada', () => {
    simpanFormatLokal('audio');
    expect(ambilIdentitas()).toBeNull();
  });

  it('menghapus identitas', () => {
    simpanIdentitas(IDENTITAS);
    hapusIdentitas();
    expect(ambilIdentitas()).toBeNull();
  });

  it('memberi tahu pelanggan saat identitas berubah', () => {
    const panggil = vi.fn();
    const berhenti = berlanggananIdentitas(panggil);
    simpanIdentitas(IDENTITAS);
    expect(panggil).toHaveBeenCalledTimes(1);
    berhenti();
    hapusIdentitas();
    expect(panggil).toHaveBeenCalledTimes(1);
  });

  it('aman ketika window tidak ada (render server)', () => {
    vi.unstubAllGlobals();
    expect(ambilIdentitas()).toBeNull();
    expect(() => simpanIdentitas(IDENTITAS)).not.toThrow();
  });
});

describe('uraiIdentitas', () => {
  it.each([null, '', 'bukan json', '{}', '{"sesiId":"x"}', '[]'])('mengembalikan null untuk %o', (mentah) => {
    expect(uraiIdentitas(mentah)).toBeNull();
  });

  it('format tidak ada dianggap null', () => {
    const { format, ...tanpaFormat } = IDENTITAS;
    expect(format).toBeNull();
    expect(uraiIdentitas(JSON.stringify(tanpaFormat))).toEqual(IDENTITAS);
  });
});
