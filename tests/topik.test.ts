import { describe, expect, it } from 'vitest';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';
import { bolehPakaiTopik } from '@/lib/topik';

const GURU_A = 'guru-a';
const GURU_B = 'guru-b';

describe('bolehPakaiTopik', () => {
  it('mengizinkan topik milik guru sendiri', () => {
    expect(bolehPakaiTopik({ id: 'topik-1', dibuatOleh: GURU_A }, GURU_A)).toBe(true);
  });

  it('menolak topik milik guru lain', () => {
    expect(bolehPakaiTopik({ id: 'topik-2', dibuatOleh: GURU_B }, GURU_A)).toBe(false);
  });

  it('mengizinkan topik demo bersama', () => {
    expect(bolehPakaiTopik({ id: TOPIK_DEMO_ID, dibuatOleh: GURU_B }, GURU_A)).toBe(true);
    expect(bolehPakaiTopik({ id: TOPIK_DEMO_ID, dibuatOleh: null }, GURU_A)).toBe(true);
  });

  it('menolak topik tanpa pemilik selain topik demo', () => {
    expect(bolehPakaiTopik({ id: 'topik-3', dibuatOleh: null }, GURU_A)).toBe(false);
  });
});
