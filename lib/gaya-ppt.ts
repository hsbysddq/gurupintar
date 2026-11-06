import type { GayaPpt } from './tipe';

export interface DefinisiGayaPpt {
  id: GayaPpt;
  kode: string;
  nama: string;
  deskripsi: string;
  latar: string;
  kertas: string;
  teks: string;
  muted: string;
  aksen: string;
  aksenTeks: string;
  font: string;
  mono: string;
}

export const GAYA_PPT: Record<GayaPpt, DefinisiGayaPpt> = {
  editorial: {
    id: 'editorial',
    kode: 'A',
    nama: 'Editorial Klasik',
    deskripsi: 'Krem hangat, serif besar, angka menonjol, aksen terracotta.',
    latar: 'F7F3EC',
    kertas: 'FFFDF8',
    teks: '1A1A1A',
    muted: '6B5E52',
    aksen: 'C2410C',
    aksenTeks: '1A1A1A',
    font: 'Georgia',
    mono: 'Consolas',
  },
  swiss: {
    id: 'swiss',
    kode: 'B',
    nama: 'Swiss Modern',
    deskripsi: 'Putih bersih, sans-serif tebal, grid rapi, aksen biru.',
    latar: 'FFFFFF',
    kertas: 'F5F5F5',
    teks: '111111',
    muted: '5B6472',
    aksen: '1B4FDB',
    aksenTeks: 'F7F3EC',
    font: 'Arial',
    mono: 'Courier New',
  },
  dark: {
    id: 'dark',
    kode: 'C',
    nama: 'Dark Tech',
    deskripsi: 'Latar gelap, teks terang, aksen neon, blok kode monospace.',
    latar: '1A1A1A',
    kertas: '242424',
    teks: 'F5F5F5',
    muted: 'A3A3A3',
    aksen: '7DD3FC',
    aksenTeks: '111111',
    font: 'Arial',
    mono: 'Consolas',
  },
  kelas: {
    id: 'kelas',
    kode: 'D',
    nama: 'Kelas Ceria',
    deskripsi: 'Hijau lembut, ramah remaja, blok banding yang jelas.',
    latar: 'F3F7EE',
    kertas: 'FFFFFF',
    teks: '23301F',
    muted: '5F6B5A',
    aksen: '2F7D4A',
    aksenTeks: 'FFFFFF',
    font: 'Trebuchet MS',
    mono: 'Consolas',
  },
  data: {
    id: 'data',
    kode: 'E',
    nama: 'Laporan Data',
    deskripsi: 'Abu-biru sejuk, teal, angka dan struktur laporan.',
    latar: 'F4F6FA',
    kertas: 'FFFFFF',
    teks: '16243A',
    muted: '526071',
    aksen: '0F766E',
    aksenTeks: 'FFFFFF',
    font: 'Arial',
    mono: 'Consolas',
  },
};

export const DAFTAR_GAYA_PPT = Object.values(GAYA_PPT);

export function ambilGayaPpt(id: string | null | undefined): DefinisiGayaPpt {
  return GAYA_PPT[id as GayaPpt] ?? GAYA_PPT.editorial;
}

export function hexCss(warna: string): string {
  return `#${warna}`;
}
