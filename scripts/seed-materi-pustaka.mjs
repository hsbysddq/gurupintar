// Mengisi pustaka materi untuk 3 kelas demo. Jalankan setelah migrasi:
// node --env-file=.env.local scripts/seed-materi-pustaka.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GURU_EMAIL = 'demo.guru@gurupintar.id';
const KELAS = [
  { id: '00000000-0000-4000-8000-00000000f201', mapel: 'Matematika' },
  { id: '00000000-0000-4000-8000-00000000f202', mapel: 'Bahasa Indonesia' },
  { id: '00000000-0000-4000-8000-00000000f203', mapel: 'IPA' },
];
const HARI = 86_400_000;

const cadangan = JSON.parse(readFileSync(new URL('../data/materi-cadangan.json', import.meta.url), 'utf8'));

function isi({ judul, ringkasan, naskah, slides, latihan }) {
  return {
    judul,
    ringkasan,
    naskah_audio: naskah,
    slide_ppt: {
      judul,
      slide: slides.map(([judulSlide, poin]) => ({ judul: judulSlide, poin })),
    },
    latihan: latihan.map(([soal, pilihan, kunci, pembahasan]) => ({ soal, pilihan, kunci, pembahasan })),
  };
}

const TEKS_DESKRIPSI_1 = isi({
  judul: 'Mengenal Teks Deskripsi',
  ringkasan:
    'Teks deskripsi adalah teks yang menggambarkan suatu objek, tempat, atau peristiwa secara rinci sehingga pembaca seolah-olah melihat, mendengar, atau merasakannya. Ciri utamanya adalah penggunaan kata sifat, pancaindra, dan kalimat yang hidup. Struktur teks deskripsi terdiri dari identifikasi, deskripsi bagian, dan penutup. Saat membaca teks deskripsi, bayangkan objeknya dan temukan kata-kata yang membuat gambaran itu terasa nyata.',
  naskah:
    'Halo! Hari ini kita belajar teks deskripsi. Teks ini menggambarkan objek dengan detail, sehingga pembaca bisa membayangkan bentuk, warna, suara, atau baunya. Ciri pentingnya banyak kata sifat dan pancaindra. Strukturnya ada identifikasi, deskripsi bagian, lalu penutup. Saat menulis, pilih kata yang konkret dan hindari kalimat yang terlalu umum.',
  slides: [
    [
      'Apa itu teks deskripsi?',
      ['Teks yang menggambarkan objek secara rinci.', 'Pembaca seolah melihat dan merasakan objek.', 'Menggunakan kata sifat dan pancaindra.'],
    ],
    [
      'Struktur teks',
      ['Identifikasi: pengenalan objek.', 'Deskripsi bagian: rincian bentuk dan suasana.', 'Penutup: kesan atau simpulan.'],
    ],
    [
      'Ciri bahasa',
      ['Gunakan kata sifat yang konkret.', 'Libatkan penglihatan, pendengaran, dan perabaan.', 'Hindari kalimat yang terlalu umum.'],
    ],
  ],
  latihan: [
    [
      'Tujuan utama teks deskripsi adalah ...',
      ['Menceritakan urutan peristiwa', 'Menggambarkan objek secara rinci', 'Membujuk pembaca membeli barang', 'Menjelaskan langkah membuat sesuatu'],
      'B',
      'Teks deskripsi membuat pembaca membayangkan objek melalui rincian yang konkret.',
    ],
    [
      'Bagian teks deskripsi yang berisi pengenalan objek disebut ...',
      ['Orientasi', 'Identifikasi', 'Komplikasi', 'Reorientasi'],
      'B',
      'Identifikasi memperkenalkan objek yang akan digambarkan.',
    ],
    [
      'Kalimat yang paling sesuai untuk teks deskripsi adalah ...',
      ['Pergi ke pasar lalu membeli sayur.', 'Pantai itu berpasir putih dan berbau air laut.', 'Pertama, panaskan minyak dalam wajan.', 'Karena hujan, acara dibatalkan.'],
      'B',
      'Kalimat itu memuat rincian penglihatan dan penciuman yang menggambarkan pantai.',
    ],
  ],
});

const TEKS_DESKRIPSI_2 = isi({
  judul: 'Menulis Teks Deskripsi yang Hidup',
  ringkasan:
    'Teks deskripsi yang hidup memakai rincian konkret, bukan kata umum. Daripada menulis taman itu indah, tulis taman itu dipenuhi bunga kuning yang berbau manis dan dedaunan basah setelah hujan. Pilih dua atau tiga pancaindra, susun kalimat dari gambaran besar ke detail, lalu tutup dengan kesan yang kuat. Hindari pengulangan kata sifat yang sama dan pastikan setiap rincian mendukung gambaran utama.',
  naskah:
    'Supaya teks deskripsimu hidup, ganti kata umum dengan rincian konkret. Jangan hanya bilang taman itu indah. Sebutkan warna bunga, aroma, dan suara burung. Pilih dua atau tiga pancaindra. Mulai dari gambaran besar, lalu masuk ke detail. Akhiri dengan kesan yang membuat pembaca ikut merasakan suasana.',
  slides: [
    [
      'Dari umum ke konkret',
      ['Kata umum membuat gambaran kabur.', 'Ganti dengan warna, bentuk, dan aroma.', 'Contoh: indah menjadi bunga kuning berbau manis.'],
    ],
    [
      'Libatkan pancaindra',
      ['Pilih dua atau tiga pancaindra.', 'Susun rincian dari gambaran besar ke detail.', 'Pastikan rincian saling mendukung.'],
    ],
    [
      'Akhiri dengan kesan',
      ['Tutup dengan perasaan atau simpulan.', 'Hindari pengulangan kata sifat.', 'Buat pembaca ikut merasakan suasana.'],
    ],
  ],
  latihan: [
    [
      'Kalimat yang paling hidup menggambarkan hujan adalah ...',
      ['Hujan turun dengan deras.', 'Air hujan membasahi jalan.', 'Butir hujan mengetuk atap dan meninggalkan bau tanah basah.', 'Hujan membuat cuaca menjadi dingin.'],
      'C',
      'Kalimat itu memakai pendengaran dan penciuman sehingga gambaran hujan terasa nyata.',
    ],
    [
      'Rincian yang paling tepat untuk menggambarkan pasar tradisional adalah ...',
      ['Pasar itu ramai.', 'Banyak orang berjualan.', 'Aroma rempah bercampur suara tawar-menawar dan tumpukan sayur hijau.', 'Pasar buka setiap hari.'],
      'C',
      'Rincian aroma, suara, dan warna membuat pasar tradisional mudah dibayangkan.',
    ],
    [
      'Agar teks deskripsi tidak membosankan, penulis sebaiknya ...',
      ['Mengulang kata indah', 'Memakai rincian konkret dan variasi kalimat', 'Menulis semua objek di dunia', 'Menghindari kata sifat'],
      'B',
      'Rincian konkret dan variasi kalimat menjaga gambaran tetap segar.',
    ],
  ],
});

const SUHU_KALOR = isi({
  judul: 'Suhu dan Kalor di Sekitar Kita',
  ringkasan:
    'Suhu menyatakan seberapa panas atau dingin suatu benda, sedangkan kalor adalah energi yang berpindah karena perbedaan suhu. Kalor selalu berpindah dari benda bersuhu tinggi ke benda bersuhu rendah. Satuan suhu yang biasa dipakai adalah derajat Celsius, sedangkan kalor diukur dalam joule. Saat air dipanaskan, kalor berpindah dari api ke air sehingga suhu air naik. Saat es mencair, kalor dipakai untuk mengubah wujud, bukan langsung menaikkan suhu.',
  naskah:
    'Suhu dan kalor itu berbeda. Suhu menunjukkan panas atau dinginnya benda. Kalor adalah energi yang berpindah dari benda panas ke benda dingin. Saat air dipanaskan, kalor dari api masuk ke air dan suhunya naik. Saat es mencair, kalor dipakai untuk mengubah wujud. Itulah sebabnya suhu es tidak langsung naik selama mencair.',
  slides: [
    [
      'Suhu vs kalor',
      ['Suhu mengukur panas atau dingin.', 'Kalor adalah energi yang berpindah.', 'Kalor bergerak dari suhu tinggi ke rendah.'],
    ],
    [
      'Satuan dan alat',
      ['Suhu diukur dengan termometer.', 'Satuan suhu: derajat Celsius.', 'Kalor diukur dalam joule.'],
    ],
    [
      'Kalor dan perubahan wujud',
      ['Es mencair karena menerima kalor.', 'Selama mencair, suhu tetap.', 'Kalor dipakai untuk mengubah wujud.'],
    ],
  ],
  latihan: [
    [
      'Energi yang berpindah karena perbedaan suhu disebut ...',
      ['Massa', 'Kalor', 'Tekanan', 'Volume'],
      'B',
      'Kalor berpindah dari benda bersuhu tinggi ke benda bersuhu rendah.',
    ],
    [
      'Saat es mencair, suhu es ...',
      ['terus naik', 'tetap sampai seluruhnya mencair', 'langsung turun', 'tidak berubah selamanya'],
      'B',
      'Selama perubahan wujud, kalor dipakai untuk memutus ikatan partikel sehingga suhu tetap.',
    ],
    [
      'Kalor berpindah dari ...',
      ['benda dingin ke benda panas', 'benda panas ke benda dingin', 'benda besar ke benda kecil', 'benda terang ke benda gelap'],
      'B',
      'Perpindahan kalor terjadi dari suhu tinggi menuju suhu rendah.',
    ],
  ],
});

const PERUBAHAN_WUJUD = isi({
  judul: 'Perubahan Wujud Benda',
  ringkasan:
    'Benda dapat berubah wujud ketika menerima atau melepaskan kalor. Es mencair menjadi air saat menerima kalor, dan air menguap menjadi uap saat dipanaskan. Sebaliknya, uap mengembun menjadi air saat didinginkan, dan air membeku menjadi es saat kehilangan kalor. Setiap perubahan wujud melibatkan kalor, tetapi suhu bisa tetap selama proses berlangsung. Memahami perubahan wujud membantu kita menjelaskan peristiwa sehari-hari seperti embun pagi dan es yang mencair.',
  naskah:
    'Benda bisa berubah wujud karena kalor. Es menerima kalor lalu mencair. Air menerima kalor lagi lalu menguap. Sebaliknya, uap melepaskan kalor dan mengembun menjadi air. Air yang kehilangan kalor membeku menjadi es. Selama perubahan wujud, suhu bisa tetap. Contohnya embun pagi terbentuk saat uap air di udara mendingin.',
  slides: [
    [
      'Menerima kalor',
      ['Es mencair menjadi air.', 'Air menguap menjadi uap.', 'Kalor masuk ke benda.'],
    ],
    [
      'Melepaskan kalor',
      ['Uap mengembun menjadi air.', 'Air membeku menjadi es.', 'Kalor keluar dari benda.'],
    ],
    [
      'Contoh sehari-hari',
      ['Embun pagi terbentuk saat uap mendingin.', 'Es dalam gelas mencair karena menerima kalor.', 'Suhu tetap selama perubahan wujud.'],
    ],
  ],
  latihan: [
    [
      'Perubahan wujud dari gas menjadi cair disebut ...',
      ['Menguap', 'Membeku', 'Mengembun', 'Mencair'],
      'C',
      'Mengembun terjadi saat uap melepaskan kalor dan berubah menjadi air.',
    ],
    [
      'Es mencair karena ...',
      ['melepaskan kalor', 'menerima kalor', 'kehilangan massa', 'bertambah tekanan'],
      'B',
      'Es menerima kalor dari lingkungan sehingga berubah menjadi air.',
    ],
    [
      'Contoh peristiwa mengembun adalah ...',
      ['Air membeku di freezer', 'Embun di pagi hari', 'Es mencair di gelas', 'Air mendidih di panci'],
      'B',
      'Embun terbentuk saat uap air di udara mendingin dan berubah menjadi titik air.',
    ],
  ],
});

const sekarang = Date.now();
const materi = [
  {
    kelas: 0,
    bab: 'Bab 2 — Bilangan Pecahan',
    isi: cadangan.belum,
    sumber: 'cadangan',
    asal: 'teks',
  },
  {
    kelas: 0,
    bab: 'Bab 2 — Bilangan Pecahan',
    isi: cadangan.setengah,
    sumber: 'cadangan',
    asal: 'pdf',
  },
  { kelas: 1, bab: 'Bab 3 — Teks Deskripsi', isi: TEKS_DESKRIPSI_1, sumber: 'ai', asal: 'teks' },
  { kelas: 1, bab: 'Bab 3 — Teks Deskripsi', isi: TEKS_DESKRIPSI_2, sumber: 'ai', asal: 'pdf' },
  { kelas: 2, bab: 'Bab 4 — Suhu dan Kalor', isi: SUHU_KALOR, sumber: 'ai', asal: 'teks' },
  { kelas: 2, bab: 'Bab 5 — Perubahan Wujud', isi: PERUBAHAN_WUJUD, sumber: 'ai', asal: 'pdf' },
];

async function main() {
  const guru = await supabase.from('pengguna').select('id').eq('email', GURU_EMAIL).maybeSingle();
  if (guru.error) throw new Error(`pengguna: ${guru.error.message}`);
  if (!guru.data) {
    throw new Error(`Akun ${GURU_EMAIL} belum ada. Jalankan scripts/seed-demo-guru.mjs dulu.`);
  }

  const kelasIds = KELAS.map((k) => k.id);
  const milik = await supabase.from('kelas').select('id').in('id', kelasIds).eq('guru_id', guru.data.id);
  if (milik.error) throw new Error(`kelas: ${milik.error.message}`);
  if ((milik.data ?? []).length !== KELAS.length) {
    throw new Error('Kelas demo tidak ditemukan. Jalankan scripts/seed-demo-guru.mjs dulu.');
  }

  const hapus = await supabase.from('materi_pustaka').delete().in('kelas_id', kelasIds);
  if (hapus.error) {
    if (hapus.error.code === '42P01') {
      throw new Error('Tabel materi_pustaka belum ada. Jalankan supabase/migrasi-materi-pustaka.sql dulu.');
    }
    throw new Error(`hapus materi lama: ${hapus.error.message}`);
  }

  const baris = materi.map((m, i) => ({
    guru_id: guru.data.id,
    kelas_id: KELAS[m.kelas].id,
    bab: m.bab,
    judul: m.isi.judul,
    isi: m.isi,
    sumber: m.sumber,
    asal: m.asal,
    dibuat_pada: new Date(sekarang - (i + 2) * HARI).toISOString(),
    diperbarui_pada: new Date(sekarang - i * HARI).toISOString(),
  }));

  const simpan = await supabase.from('materi_pustaka').insert(baris);
  if (simpan.error) {
    if (simpan.error.code === '42P01') {
      throw new Error('Tabel materi_pustaka belum ada. Jalankan supabase/migrasi-materi-pustaka.sql dulu.');
    }
    throw new Error(`simpan materi: ${simpan.error.message}`);
  }

  console.log('\nPustaka materi demo siap.');
  for (const k of KELAS) {
    const jumlah = materi.filter((m) => KELAS[m.kelas].id === k.id).length;
    console.log(`- ${k.mapel}: ${jumlah} materi`);
  }
}

main().catch((err) => {
  console.error('\nGagal mengisi pustaka materi:', err.message);
  process.exit(1);
});
