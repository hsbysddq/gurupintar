import type { GayaBacaan } from './tipe';

export interface DefinisiGayaBacaan {
  id: GayaBacaan;
  kode: string;
  nama: string;
  deskripsi: string;
  cocok: string;
  contoh: string;
}

export const GAYA_BACAAN: Record<GayaBacaan, DefinisiGayaBacaan> = {
  santai: {
    id: 'santai',
    kode: 'A',
    nama: 'Ngobrol Santai',
    deskripsi: 'Seperti guru yang mengobrol langsung dengan siswa, memakai “kamu” dan contoh sehari-hari.',
    cocok: 'Belajar harian yang ingin terasa dekat dan tidak menggurui.',
    contoh: '“Kamu pernah bingung kenapa 1/2 lebih besar dari 1/3? Kita bedah pelan-pelan.”',
  },
  bercerita: {
    id: 'bercerita',
    kode: 'B',
    nama: 'Bercerita',
    deskripsi: 'Satu cerita mengalir dengan tokoh, konflik kecil, dan contoh yang mudah dibayangkan.',
    cocok: 'Konsep abstrak yang lebih mudah dipahami lewat pengalaman tokoh.',
    contoh: '“Rani membagi tiga potong kue kepada empat temannya. Ia mulai bingung.”',
  },
  catatan: {
    id: 'catatan',
    kode: 'C',
    nama: 'Catatan Belajar',
    deskripsi: 'Ringkas, bertahap, dengan langkah bernomor dan kotak “Coba sendiri” yang santai.',
    cocok: 'Siswa yang suka membaca cepat lalu langsung mencoba.',
    contoh: '“Langkah 1: lihat penyebutnya. Coba sendiri: sebutkan dua pecahan senilai dengan 1/2.”',
  },
};

export const DAFTAR_GAYA_BACAAN = Object.values(GAYA_BACAAN);

export const INSTRUKSI_GAYA_BACAAN: Record<GayaBacaan, string> = {
  santai:
    'Gaya A Ngobrol Santai: tulis seperti guru yang mengobrol dengan satu siswa. Gunakan “kamu”, pertanyaan retoris, dan contoh sehari-hari. Paragraf pendek, bahasa hangat, tidak menggurui, dan tidak seperti buku teks resmi.',
  bercerita:
    'Gaya B Bercerita: gunakan satu alur cerita atau tokoh fiktif dari awal sampai akhir. Konsep muncul dari kejadian dan konflik kecil yang dialami tokoh. Jangan mengaku kisah nyata; akhiri dengan refleksi singkat yang menghubungkan cerita dengan konsep.',
  catatan:
    'Gaya C Catatan Belajar: tulis ringkas dan bertahap. Gunakan langkah bernomor, kalimat pendek, dan satu kotak “Coba sendiri” di akhir bab berisi satu pertanyaan atau latihan singkat yang tidak dinilai. Hindari narasi panjang.',
};

export function ambilGayaBacaan(id: string | null | undefined): DefinisiGayaBacaan {
  return GAYA_BACAAN[id as GayaBacaan] ?? GAYA_BACAAN.santai;
}
