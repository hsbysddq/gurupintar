import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ambilSesi,
  berlanggananSesi,
  hapusSesi,
  simpanFormatLokal,
  simpanSesi,
  uraiSesi,
  type SesiAktif,
} from '@/lib/sesi-lokal';

const SESI: SesiAktif = {
  sesiId: 'sesi-1',
  kodeKelas: 'A7K2P',
  format: null,
};

function penyimpananPalsu(): Storage {
  const isi = new Map<string, string>();
  return {
    get length() {
      return isi.size;
    },
    clear: () => isi.clear(),
    getItem: (k) => isi.get(k) ?? null,
    key: (i) => [...isi.keys()][i] ?? null,
    removeItem: (k) => {
      isi.delete(k);
    },
    setItem: (k, v) => {
      isi.set(k, v);
    },
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
  it('null jika belum ada sesi', () => {
    expect(ambilSesi()).toBeNull();
  });

  it('menyimpan dan membaca sesi aktif', () => {
    simpanSesi(SESI);
    expect(ambilSesi()).toEqual(SESI);
  });

  it('menyimpan format tanpa mengubah data lain', () => {
    simpanSesi(SESI);
    simpanFormatLokal('audio');
    expect(ambilSesi()).toEqual({ ...SESI, format: 'audio' });
  });

  it('simpanFormatLokal tidak membuat sesi baru jika belum ada', () => {
    simpanFormatLokal('audio');
    expect(ambilSesi()).toBeNull();
  });

  it('menghapus sesi', () => {
    simpanSesi(SESI);
    hapusSesi();
    expect(ambilSesi()).toBeNull();
  });

  it('memberi tahu pelanggan saat sesi berubah', () => {
    const panggil = vi.fn();
    const berhenti = berlanggananSesi(panggil);
    simpanSesi(SESI);
    expect(panggil).toHaveBeenCalledTimes(1);
    berhenti();
    hapusSesi();
    expect(panggil).toHaveBeenCalledTimes(1);
  });

  it('aman ketika window tidak ada (render server)', () => {
    vi.unstubAllGlobals();
    expect(ambilSesi()).toBeNull();
    expect(() => simpanSesi(SESI)).not.toThrow();
  });
});

describe('uraiSesi', () => {
  it.each([null, '', 'bukan json', '{}', '{"sesiId":"x"}', '[]'])('mengembalikan null untuk %o', (mentah) => {
    expect(uraiSesi(mentah)).toBeNull();
  });

  it('format tidak ada atau tidak dikenal dianggap null', () => {
    const tanpaFormat = { sesiId: 's', kodeKelas: 'A7K2P', format: null };
    expect(uraiSesi(JSON.stringify({ sesiId: 's', kodeKelas: 'A7K2P' }))).toEqual(tanpaFormat);
    expect(uraiSesi(JSON.stringify({ sesiId: 's', kodeKelas: 'A7K2P', format: 'visual' }))).toEqual(tanpaFormat);
  });
});
