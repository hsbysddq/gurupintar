import type { GayaAudio } from './tipe';

export interface DefinisiGayaAudio {
  id: GayaAudio;
  kode: string;
  nama: string;
  deskripsi: string;
  cocok: string;
  contoh: string;
  suara: string;
}

export const GAYA_AUDIO: Record<GayaAudio, DefinisiGayaAudio> = {
  docu: {
    id: 'docu',
    kode: 'A',
    nama: 'Docu Vlog',
    deskripsi: 'Dokumenter bercerita, narator orang pertama, tiga babak, dan refleksi tenang.',
    cocok: 'Konsep yang butuh cerita, konteks, dan suasana.',
    contoh: 'Di sebuah kelas, seorang siswa bertanya kenapa 1/2 lebih besar dari 1/3.',
    suara: '1 suara',
  },
  podcast: {
    id: 'podcast',
    kode: 'B',
    nama: 'Podcast Guru',
    deskripsi: 'Satu host, obrolan hangat, langsung ke inti, dan mudah diikuti.',
    cocok: 'Penjelasan cepat yang terasa seperti teman bicara.',
    contoh: 'Pernahkah kamu merasa angka pecahan itu membingungkan? Kita bedah pelan-pelan.',
    suara: '1 suara',
  },
  dialog: {
    id: 'dialog',
    kode: 'C',
    nama: 'Dua Sahabat',
    deskripsi: 'Dialog guru dan siswa, tanya-jawab natural, tanpa terasa seperti wawancara.',
    cocok: 'Materi yang sering disalahpahami dan perlu diluruskan.',
    contoh: 'GURU: Coba bayangkan dua potong kue yang ukurannya berbeda.',
    suara: '2 peran',
  },
  cerita: {
    id: 'cerita',
    kode: 'D',
    nama: 'Cerita Mini',
    deskripsi: 'Kisah pendek dengan tokoh, konflik, dan penyelesaian yang menjelaskan konsep.',
    cocok: 'Konsep abstrak yang lebih mudah lewat pengalaman tokoh.',
    contoh: 'Rani punya tiga potong kue. Ia ingin membaginya adil kepada empat temannya.',
    suara: '1 suara',
  },
};

export const DAFTAR_GAYA_AUDIO = Object.values(GAYA_AUDIO);

export const INSTRUKSI_GAYA_AUDIO: Record<GayaAudio, string> = {
  docu:
    'Gaya A Docu Vlog: tulis sebagai narator orang pertama yang tenang dan reflektif. Buka dengan konflik, pertanyaan, atau data yang mengejutkan; jangan menyapa pendengar. Susun tiga babak: masalah atau adegan, penelusuran atau penjelasan, lalu refleksi. Pakai satu adegan ilustratif dan satu analogi utama. Jangan meniru podcast, jangan mewawancarai narasumber, dan jangan mengaku pernah ke lokasi atau mengalami peristiwa nyata. Akhiri dengan refleksi tenang, bukan ajakan jualan.',
  podcast:
    'Gaya B Podcast Guru: satu host yang hangat dan langsung ke topik. Boleh memakai pertanyaan retoris dan cerita kecil, tetapi jangan bertele-tele. Jelaskan konsep dengan contoh, beri penekanan pada satu ide utama, lalu tutup dengan ajakan kecil untuk mencoba. Jangan memakai pembuka podcast yang panjang.',
  dialog:
    'Gaya C Dua Sahabat: tulis dialog antara GURU dan SISWA. Setiap baris diawali "GURU:" atau "SISWA:". Siswa bertanya seperti murid kelas 7 yang penasaran; guru menjawab singkat, hangat, dan memakai contoh. Jangan membuat wawancara formal atau dialog yang saling memuji.',
  cerita:
    'Gaya D Cerita Mini: tulis kisah pendek dengan satu tokoh utama, konflik yang jelas, dan penyelesaian yang menjelaskan konsep. Gunakan nama tokoh fiktif dan adegan sehari-hari. Jangan mengaku kisah ini nyata. Setelah konflik selesai, tarik satu pelajaran singkat.',
};

export const INSTRUKSI_AUDIO = [
  'Untuk format audio, buat hanya naskah_audio. Jangan membuat ringkasan, slide, ide video, atau latihan.',
  'Panjang 600–1.000 kata (sekitar 3.500–6.000 karakter), cukup untuk 5–8 menit mendengarkan.',
  'Tulis narasi utuh yang enak dibacakan. Gunakan kalimat pendek, satu gagasan per kalimat, dan paragraf 2–4 kalimat.',
  'Jangan menyalin kalimat modul. Ambil konsepnya, lalu tulis ulang dengan cerita, analogi, dan contoh sendiri.',
  'Jangan memakai bullet, heading, penanda teknis, placeholder, atau teks dalam tanda kurung siku.',
  'Jangan mengarang data, nama orang nyata, atau peristiwa yang mengaku benar-benar terjadi.',
  'Jangan menyebut label kelompok, tingkat kemampuan, atau kata "kelompok".',
  'Tulis pecahan dengan kata saat dibacakan, misalnya "satu per dua", agar tidak salah baca.',
  'Akhiri dengan satu refleksi atau ajakan kecil yang tenang, bukan pujian berlebihan.',
].join('\n');

export function ambilGayaAudio(id: string | null | undefined): DefinisiGayaAudio {
  return GAYA_AUDIO[id as GayaAudio] ?? GAYA_AUDIO.docu;
}
