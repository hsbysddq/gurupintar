import { describe, expect, it } from 'vitest';
import { normalisasiNomorWhatsapp, susunGrafikKoin, tautanTopUpKoin } from '@/lib/koin';
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

describe('susunGrafikKoin', () => {
  it('menghitung koin keluar dan masuk per hari selama 7 hari', () => {
    const sekarang = new Date(2026, 10, 3, 12);
    const grafik = susunGrafikKoin(
      [
        { jumlah: -1, dibuatPada: new Date(2026, 10, 3, 9).toISOString() },
        { jumlah: 1, dibuatPada: new Date(2026, 10, 3, 10).toISOString() },
        { jumlah: -2, dibuatPada: new Date(2026, 10, 1, 9).toISOString() },
        { jumlah: 5, dibuatPada: new Date(2026, 9, 20, 9).toISOString() },
      ],
      sekarang,
      7,
    );

    expect(grafik).toHaveLength(7);
    expect(grafik[6]).toMatchObject({ keluar: 1, masuk: 1 });
    expect(grafik[4]).toMatchObject({ keluar: 2, masuk: 0 });
    expect(grafik.reduce((n, h) => n + h.keluar, 0)).toBe(3);
    expect(grafik.reduce((n, h) => n + h.masuk, 0)).toBe(1);
  });

  it('mengembalikan tujuh hari kosong jika belum ada transaksi', () => {
    const grafik = susunGrafikKoin([], new Date(2026, 10, 3, 12), 7);
    expect(grafik).toHaveLength(7);
    expect(grafik.every((h) => h.keluar === 0 && h.masuk === 0)).toBe(true);
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
