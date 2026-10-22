import { describe, expect, it } from 'vitest';
import { tentukanStatusMateriSiswa } from '@/lib/status-materi-siswa';

describe('tentukanStatusMateriSiswa', () => {
  it('belum-mengerjakan jika siswa belum punya hasil', () => {
    expect(tentukanStatusMateriSiswa(null, [])).toBe('belum-mengerjakan');
    expect(tentukanStatusMateriSiswa(undefined, [{ kelompok: 'sudah' }])).toBe('belum-mengerjakan');
  });

  it('disiapkan jika hasil ada tetapi materi kelompoknya belum dibagikan', () => {
    expect(tentukanStatusMateriSiswa({ kelompok: 'sudah' }, [])).toBe('disiapkan');
    expect(tentukanStatusMateriSiswa({ kelompok: 'sudah' }, [{ kelompok: 'belum' }])).toBe('disiapkan');
  });

  it('tersedia jika materi untuk kelompok siswa sudah dibagikan', () => {
    expect(tentukanStatusMateriSiswa({ kelompok: 'setengah' }, [{ kelompok: 'setengah' }])).toBe('tersedia');
  });
});
