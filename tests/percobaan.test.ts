import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ambilPercobaanSiswa, tabelPercobaanBelumAda } from '@/lib/server/percobaan';

describe('tabelPercobaanBelumAda', () => {
  it('mengenali pesan tabel belum dibuat', () => {
    expect(tabelPercobaanBelumAda({ message: 'relation "public.percobaan_kuis" does not exist' })).toBe(true);
    expect(
      tabelPercobaanBelumAda({ message: "Could not find the table 'public.percobaan_kuis' in the schema cache" }),
    ).toBe(true);
  });

  it('mengabaikan error lain', () => {
    expect(tabelPercobaanBelumAda({ message: 'connection reset' })).toBe(false);
    expect(tabelPercobaanBelumAda({ message: 'relation "kelas" does not exist' })).toBe(false);
    expect(tabelPercobaanBelumAda(null)).toBe(false);
  });
});

// Penyusun kueri palsu: mencatat tabel yang dibaca dan mengembalikan hasil sesuai tabel.
function dbPalsu(hasilPerTabel: Record<string, { data?: unknown[]; error?: { message: string } }>) {
  const dibaca: string[] = [];
  const db = {
    from(tabel: string) {
      dibaca.push(tabel);
      const kueri = {
        select: () => kueri,
        eq: () => kueri,
        in: () => kueri,
        order: () => kueri,
        limit: () => kueri,
        then: (selesai: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null, ...hasilPerTabel[tabel] }).then(selesai),
      };
      return kueri;
    },
  };
  return { db: db as unknown as SupabaseClient, dibaca };
}

describe('ambilPercobaanSiswa', () => {
  it('membaca semua percobaan dari tabel percobaan_kuis', async () => {
    const { db, dibaca } = dbPalsu({ percobaan_kuis: { data: [{ skor: 1 }, { skor: 5 }] } });
    expect(await ambilPercobaanSiswa(db, 'siswa-1', 'skor')).toEqual([{ skor: 1 }, { skor: 5 }]);
    expect(dibaca).toEqual(['percobaan_kuis']);
  });

  it('jatuh ke hasil_siswa bila migrasi belum dijalankan', async () => {
    const { db, dibaca } = dbPalsu({
      percobaan_kuis: { error: { message: 'relation "public.percobaan_kuis" does not exist' } },
      hasil_siswa: { data: [{ skor: 3 }] },
    });
    expect(await ambilPercobaanSiswa(db, 'siswa-1', 'skor', { idSesi: ['s1'] })).toEqual([{ skor: 3 }]);
    expect(dibaca).toEqual(['percobaan_kuis', 'hasil_siswa']);
  });

  it('melempar error lain apa adanya', async () => {
    const { db } = dbPalsu({ percobaan_kuis: { error: { message: 'timeout' } } });
    await expect(ambilPercobaanSiswa(db, 'siswa-1', 'skor')).rejects.toEqual({ message: 'timeout' });
  });
});
