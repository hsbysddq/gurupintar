import { describe, expect, it } from 'vitest';
import { ringkasStatusMateri } from '@/lib/status-materi';

const m = (status: 'draf' | 'dibagikan') => ({ status });

describe('ringkasStatusMateri', () => {
  it('belum-ada jika tidak ada materi', () => {
    expect(ringkasStatusMateri([])).toBe('belum-ada');
  });

  it('draf jika semua materi masih draf', () => {
    expect(ringkasStatusMateri([m('draf'), m('draf')])).toBe('draf');
  });

  it('dibagikan jika semua materi sudah dibagikan', () => {
    expect(ringkasStatusMateri([m('dibagikan'), m('dibagikan')])).toBe('dibagikan');
  });

  it('campuran jika ada draf dan dibagikan', () => {
    expect(ringkasStatusMateri([m('draf'), m('dibagikan')])).toBe('campuran');
  });
});
