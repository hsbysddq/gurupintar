import { describe, expect, it, vi } from 'vitest';
import materiCadangan from '@/data/materi-cadangan.json';
import { catatRiwayatModul } from '@/lib/server/riwayat-modul';
import type { IsiMateri } from '@/lib/validasi-materi';

function isiBacaan(): IsiMateri {
  return {
    ...(materiCadangan.belum as IsiMateri),
    format_utama: 'bacaan',
  };
}

describe('catatRiwayatModul', () => {
  it('menyimpan judul, format, gaya, dan isi materi', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const db = { from: vi.fn(() => ({ insert })) };

    const isi = isiBacaan();
    await catatRiwayatModul(db as never, 'guru-1', isi);

    expect(db.from).toHaveBeenCalledWith('riwayat_modul');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        guru_id: 'guru-1',
        judul: isi.judul,
        format: 'bacaan',
        gaya_audio: null,
        isi,
        sumber: 'ai',
      }),
    );
  });

  it('tidak menggagalkan generate jika pencatatan gagal', async () => {
    const db = {
      from: () => ({
        insert: vi.fn().mockResolvedValue({ error: { message: 'tabel belum ada' } }),
      }),
    };
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(catatRiwayatModul(db as never, 'guru-1', isiBacaan())).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
