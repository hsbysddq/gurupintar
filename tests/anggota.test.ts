import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hapusAnggotaKelas } from '@/lib/server/anggota';

type Hasil = { data?: unknown[]; error?: { message: string } };

// Kueri palsu: mencatat urutan "tabel:aksi" dan mengembalikan hasil yang sudah ditentukan per tabel.
function dbPalsu(hasil: Record<string, Hasil> = {}) {
  const catatan: string[] = [];
  const db = {
    from(tabel: string) {
      let aksi = 'select';
      const kueri = {
        select: () => kueri,
        delete: () => {
          aksi = 'delete';
          return kueri;
        },
        eq: () => kueri,
        in: () => kueri,
        then: (selesai: (v: unknown) => unknown) => {
          catatan.push(`${tabel}:${aksi}`);
          return Promise.resolve({ data: null, error: null, ...hasil[tabel] }).then(selesai);
        },
      };
      return kueri;
    },
  };
  return { db: db as unknown as SupabaseClient, catatan };
}

describe('hapusAnggotaKelas', () => {
  it('menghapus jawaban, percobaan, hasil, lalu keanggotaan (keanggotaan terakhir)', async () => {
    const { db, catatan } = dbPalsu({ sesi_kuis: { data: [{ id: 's1' }, { id: 's2' }] } });
    await hapusAnggotaKelas(db, 'k1', 'siswa-1');
    expect(catatan).toEqual([
      'sesi_kuis:select',
      'jawaban:delete',
      'percobaan_kuis:delete',
      'hasil_siswa:delete',
      'keanggotaan_kelas:delete',
    ]);
  });

  it('kelas tanpa kuis: hanya keanggotaan yang dihapus', async () => {
    const { db, catatan } = dbPalsu({ sesi_kuis: { data: [] } });
    await hapusAnggotaKelas(db, 'k1', 'siswa-1');
    expect(catatan).toEqual(['sesi_kuis:select', 'keanggotaan_kelas:delete']);
  });

  it('tetap jalan bila tabel percobaan_kuis belum dibuat', async () => {
    const { db, catatan } = dbPalsu({
      sesi_kuis: { data: [{ id: 's1' }] },
      percobaan_kuis: { error: { message: 'relation "public.percobaan_kuis" does not exist' } },
    });
    await hapusAnggotaKelas(db, 'k1', 'siswa-1');
    expect(catatan.at(-1)).toBe('keanggotaan_kelas:delete');
    expect(catatan).toContain('hasil_siswa:delete');
  });

  it('berhenti sebelum menghapus keanggotaan bila langkah lain gagal', async () => {
    const { db, catatan } = dbPalsu({
      sesi_kuis: { data: [{ id: 's1' }] },
      hasil_siswa: { error: { message: 'timeout' } },
    });
    await expect(hapusAnggotaKelas(db, 'k1', 'siswa-1')).rejects.toEqual({ message: 'timeout' });
    expect(catatan).not.toContain('keanggotaan_kelas:delete');
  });
});
