import { describe, expect, it } from 'vitest';
import { normalisasiNomorWhatsapp, tautanTopUpKoin } from '@/lib/koin';
import { perluMigrasiKoin } from '@/lib/server/koin';

describe('normalisasiNomorWhatsapp', () => {
  it.each([
    ['0812-3456-7890', '6281234567890'],
    ['+62 812 3456 7890', '6281234567890'],
    ['81234567890', '6281234567890'],
    ['6281234567890', '6281234567890'],
  ])('mengubah %s menjadi %s', (masukan, hasil) => {
    expect(normalisasiNomorWhatsapp(masukan)).toBe(hasil);
  });

  it('null untuk nomor kosong', () => {
    expect(normalisasiNomorWhatsapp('')).toBeNull();
    expect(normalisasiNomorWhatsapp(null)).toBeNull();
    expect(normalisasiNomorWhatsapp('bukan nomor')).toBeNull();
  });
});

describe('tautanTopUpKoin', () => {
  it('membuat tautan wa.me dengan pesan saldo', () => {
    const tautan = tautanTopUpKoin('0812-3456-7890', 3);
    expect(tautan).toContain('https://wa.me/6281234567890?text=');
    expect(decodeURIComponent(tautan!.split('?text=')[1])).toContain('Saldo saya saat ini 3 koin');
    expect(decodeURIComponent(tautan!.split('?text=')[1])).toContain('Ubah Modul');
  });

  it('null jika nomor admin belum diatur', () => {
    expect(tautanTopUpKoin('', 3)).toBeNull();
    expect(tautanTopUpKoin(null, 0)).toBeNull();
  });
});

describe('perluMigrasiKoin', () => {
  it('mengenali kolom, tabel, atau fungsi koin yang belum dibuat', () => {
    expect(perluMigrasiKoin({ message: 'column pengguna.koin does not exist' })).toBe(true);
    expect(perluMigrasiKoin({ message: "relation 'transaksi_koin' does not exist" })).toBe(true);
    expect(perluMigrasiKoin({ message: "Could not find the function public.potong_koin" })).toBe(true);
  });

  it('tidak menandai error lain', () => {
    expect(perluMigrasiKoin({ message: 'KOIN_TIDAK_CUKUP' })).toBe(false);
    expect(perluMigrasiKoin({ message: 'connection reset' })).toBe(false);
    expect(perluMigrasiKoin(null)).toBe(false);
  });
});
