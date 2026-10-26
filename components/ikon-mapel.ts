import { BookOpen, Calculator, FlaskConical, Globe2, type LucideIcon } from 'lucide-react';
import { indeksWarna } from '@/lib/beranda-siswa';

export type KunciIkonMapel = 'hitung' | 'sains' | 'sosial' | 'buku';

/** Tabel ikon statis, supaya komponen cukup mencari ikon tanpa membuat komponen baru saat render. */
export const IKON_MAPEL: Record<KunciIkonMapel, LucideIcon> = {
  hitung: Calculator,
  sains: FlaskConical,
  sosial: Globe2,
  buku: BookOpen,
};

/** Jenis ikon mata pelajaran berdasarkan namanya; mapel yang tidak dikenal memakai ikon buku. */
export function kunciIkonMapel(mapel: string): KunciIkonMapel {
  const m = mapel.toLowerCase();
  if (/mat|hitung/.test(m)) return 'hitung';
  if (/ipa|sains|fisika|kimia|biologi/.test(m)) return 'sains';
  if (/ips|ekonomi|sejarah|geografi|sosiologi|pkn|ppkn/.test(m)) return 'sosial';
  return 'buku';
}

export function ikonMapel(mapel: string): LucideIcon {
  return IKON_MAPEL[kunciIkonMapel(mapel)];
}

// Pasangan warna ikon, bilah progres, dan banner tiap mata pelajaran.
export const WARNA_MAPEL = [
  {
    ikon: 'bg-aura-primary/10 text-aura-primary',
    bilah: 'bg-aura-primary',
    teks: 'text-aura-primary',
    banner: 'from-aura-primary-deep to-aura-indigo',
  },
  {
    ikon: 'bg-aura-emerald/10 text-aura-emerald',
    bilah: 'bg-aura-emerald',
    teks: 'text-aura-emerald',
    banner: 'from-sudah-teks to-sudah',
  },
  {
    ikon: 'bg-aura-amber/10 text-aura-amber',
    bilah: 'bg-aura-amber',
    teks: 'text-aura-amber',
    banner: 'from-setengah-teks to-belum-teks',
  },
];

/** Warna satu mapel, stabil per kelas sehingga kartu di daftar dan banner di detail selalu sama. */
export function warnaMapel(kelasId: string) {
  return WARNA_MAPEL[indeksWarna(kelasId, WARNA_MAPEL.length)];
}
