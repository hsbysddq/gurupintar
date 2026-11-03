import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BATAS_PELANGGARAN } from '@/lib/deteksi-curang';
import { bacaBlokir, bukaBlokirSiswa, catatPelanggaranSiswa, daftarDiblokir, tabelBlokirBelumAda } from '@/lib/server/blokir';

type Baris = { sesi_id: string; siswa_id: string; jumlah: number; terblokir: boolean; jumlah_blokir: number; diblokir_pada?: string | null };

/** Basis data palsu satu tabel (blokir_kuis) cukup untuk kueri yang dipakai lib/server/blokir. */
function basisPalsu(awal: Baris[] = [], galat: { message: string } | null = null) {
  const baris = [...awal];
  const cocok = (b: Baris, saring: Record<string, unknown>) =>
    Object.entries(saring).every(([k, v]) => {
      if (k.startsWith('gt:')) return Number((b as Record<string, unknown>)[k.slice(3)]) > Number(v);
      return (b as Record<string, unknown>)[k] === v;
    });
  const db = {
    from: () => {
      const saring: Record<string, unknown> = {};
      const q = {
        select: () => q,
        eq: (k: string, v: unknown) => {
          saring[k] = v;
          return q;
        },
        gt: (k: string, v: unknown) => {
          saring[`gt:${k}`] = v;
          return q;
        },
        maybeSingle: async () => ({ data: galat ? null : (baris.find((b) => cocok(b, saring)) ?? null), error: galat }),
        then: (res: (v: { data: Baris[] | null; error: typeof galat }) => unknown) =>
          res({ data: galat ? null : baris.filter((b) => cocok(b, saring)), error: galat }),
        upsert: async (nilai: Baris) => {
          if (galat) return { error: galat };
          const i = baris.findIndex((b) => b.sesi_id === nilai.sesi_id && b.siswa_id === nilai.siswa_id);
          if (i >= 0) baris[i] = { ...baris[i], ...nilai };
          else baris.push(nilai);
          return { error: null };
        },
        update: (nilai: Partial<Baris>) => ({
          eq: (k1: string, v1: unknown) => ({
            eq: async (k2: string, v2: unknown) => {
              for (const b of baris) if (cocok(b, { [k1]: v1, [k2]: v2 })) Object.assign(b, nilai);
              return { error: null };
            },
          }),
        }),
      };
      return q;
    },
  };
  return { db: db as unknown as SupabaseClient, baris };
}

const TABEL_HILANG = { message: 'relation "public.blokir_kuis" does not exist' };

describe('tabelBlokirBelumAda', () => {
  it('mengenali pesan tabel belum dibuat', () => {
    expect(tabelBlokirBelumAda(TABEL_HILANG)).toBe(true);
    expect(tabelBlokirBelumAda({ message: "Could not find the table 'public.blokir_kuis' in the schema cache" })).toBe(true);
  });

  it('mengabaikan error lain', () => {
    expect(tabelBlokirBelumAda({ message: 'connection reset' })).toBe(false);
    expect(tabelBlokirBelumAda({ message: 'relation "kelas" does not exist' })).toBe(false);
    expect(tabelBlokirBelumAda(null)).toBe(false);
  });
});

describe('catatPelanggaranSiswa', () => {
  it('memblokir pada pelanggaran ke-3 dan menyimpannya', async () => {
    const { db, baris } = basisPalsu();
    for (let i = 1; i < BATAS_PELANGGARAN; i++) {
      const hasil = await catatPelanggaranSiswa(db, 'sesi', 'siswa');
      expect(hasil.keadaan).toMatchObject({ jumlah: i, terblokir: false });
    }
    const akhir = await catatPelanggaranSiswa(db, 'sesi', 'siswa');
    expect(akhir.keadaan).toEqual({ jumlah: BATAS_PELANGGARAN, terblokir: true, jumlahBlokir: 1 });
    expect(baris).toHaveLength(1);
    expect(baris[0].terblokir).toBe(true);
    expect(baris[0].diblokir_pada).toBeTruthy();
  });

  it('tidak menghitung siswa lain atau kuis lain', async () => {
    const { db } = basisPalsu();
    await catatPelanggaranSiswa(db, 'sesi', 'a');
    await catatPelanggaranSiswa(db, 'sesi', 'a');
    expect((await catatPelanggaranSiswa(db, 'sesi', 'b')).keadaan.jumlah).toBe(1);
    expect((await catatPelanggaranSiswa(db, 'sesi-lain', 'a')).keadaan.jumlah).toBe(1);
  });

  it('tabel belum dibuat: tidak error dan tidak memblokir', async () => {
    const { db } = basisPalsu([], TABEL_HILANG);
    const hasil = await catatPelanggaranSiswa(db, 'sesi', 'siswa');
    expect(hasil).toEqual({ keadaan: { jumlah: 0, terblokir: false, jumlahBlokir: 0 }, tersedia: false });
    expect(await bacaBlokir(db, 'sesi', 'siswa')).toBeNull();
    expect(await daftarDiblokir(db, 'sesi')).toEqual([]);
  });
});

describe('bukaBlokirSiswa', () => {
  const diblokir = (): Baris => ({ sesi_id: 'sesi', siswa_id: 'siswa', jumlah: 3, terblokir: true, jumlah_blokir: 1 });

  it('membuka blokir: hitungan nol dan riwayat blokir tetap', async () => {
    const { db, baris } = basisPalsu([diblokir()]);
    expect(await bukaBlokirSiswa(db, 'sesi', 'siswa')).toBe(true);
    expect(baris[0]).toMatchObject({ jumlah: 0, terblokir: false, jumlah_blokir: 1 });
    expect(await daftarDiblokir(db, 'sesi')).toEqual([]);
  });

  it('false bila siswa tidak sedang diblokir', async () => {
    const { db } = basisPalsu([{ ...diblokir(), terblokir: false, jumlah: 1 }]);
    expect(await bukaBlokirSiswa(db, 'sesi', 'siswa')).toBe(false);
    expect(await bukaBlokirSiswa(db, 'sesi', 'tidak-ada')).toBe(false);
  });

  it('setelah dibuka, pelanggaran berikutnya mulai dari satu', async () => {
    const { db } = basisPalsu([diblokir()]);
    await bukaBlokirSiswa(db, 'sesi', 'siswa');
    expect((await catatPelanggaranSiswa(db, 'sesi', 'siswa')).keadaan).toEqual({ jumlah: 1, terblokir: false, jumlahBlokir: 1 });
  });
});

describe('daftarDiblokir', () => {
  it('mengembalikan semua indikasi kecurangan pada kuis itu, termasuk yang belum diblokir', async () => {
    const { db } = basisPalsu([
      { sesi_id: 'sesi', siswa_id: 'a', jumlah: 3, terblokir: true, jumlah_blokir: 2, diblokir_pada: '2026-11-03T10:00:00Z' },
      { sesi_id: 'sesi', siswa_id: 'b', jumlah: 1, terblokir: false, jumlah_blokir: 0 },
      { sesi_id: 'lain', siswa_id: 'c', jumlah: 3, terblokir: true, jumlah_blokir: 1 },
    ]);
    expect(await daftarDiblokir(db, 'sesi')).toEqual([
      { siswaId: 'a', jumlah: 3, terblokir: true, jumlahBlokir: 2, diblokirPada: '2026-11-03T10:00:00Z' },
      { siswaId: 'b', jumlah: 1, terblokir: false, jumlahBlokir: 0, diblokirPada: null },
    ]);
  });
});
