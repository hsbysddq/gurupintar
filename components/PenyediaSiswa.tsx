'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Profil } from '@/lib/tipe';

const KonteksSiswa = createContext<Profil | null>(null);

/** Profil siswa dari server; tidak pernah berisi kelompok atau data rahasia. */
export function PenyediaSiswa({ profil, children }: { profil: Profil; children: ReactNode }) {
  return <KonteksSiswa.Provider value={profil}>{children}</KonteksSiswa.Provider>;
}

export function useSiswa(): Profil {
  const profil = useContext(KonteksSiswa);
  if (!profil) throw new Error('useSiswa harus dipakai di dalam PenyediaSiswa.');
  return profil;
}
