# PRD: Guru Pintar

| Atribut | Isi |
| --- | --- |
| Versi | 1.1 |
| Tanggal | 27 September 2026 |
| Jenis | Prototipe hackathon (1–2 hari), bisa dicoba juri |
| Alat bantu | Claude Code |
| Dokumen terkait | `architecture.md` (teknis), `design.md` (UI/UX), `agenda.md` (urutan kerja & prompt) |

> **Aturan untuk Claude Code dan tim**
> - PRD ini menjawab **apa** yang dibangun dan **mengapa**. `architecture.md` menjawab **bagaimana** sisi teknis, `design.md` menjawab **bagaimana tampilannya**, `agenda.md` menjawab **urutan pengerjaannya**.
> - Jika ada pertentangan soal kebutuhan pengguna, **PRD yang berlaku**. Jika soal teknis, `architecture.md` yang berlaku.
> - Jangan menambah fitur yang tidak ada di dokumen ini. Jika ada yang tidak jelas, **berhenti dan tanyakan**.

---

## 0. Jawaban Singkat

| Pertanyaan | Jawaban |
| --- | --- |
| Mau membuat apa? | Web app untuk guru: cek pemahaman kilat 5 soal, pengelompokan siswa otomatis, dan materi lanjutan per kelompok dibuat dengan bantuan AI |
| Siapa yang memakai? | Guru matematika SMP (utama, di laptop) dan siswa kelas 7 (kedua, di HP) |
| Stack apa? | Next.js + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + Anthropic API, di-deploy ke Vercel |
| Monolith atau microservices? | **Monolith modular**: satu aplikasi Next.js berisi tampilan dan API. Alasan di `architecture.md` bagian 1 |
| Markdown apa saja? | `PRD.md`, `architecture.md`, `design.md`, `agenda.md` |

---

## 1. Ringkasan

Guru Pintar membantu guru SMP mengetahui siswa mana yang belum paham **pada hari yang sama**, lalu menyiapkan materi lanjutan yang berbeda untuk setiap kelompok dengan bantuan AI.

Alur inti:

1. Guru membuka kuis 5 soal dan menampilkan kode kelas beserta QR.
2. Siswa bergabung dari HP, memilih bentuk materi yang disukai, lalu menjawab kuis.
3. Sistem mengelompokkan siswa menjadi **Sudah Paham**, **Setengah Paham**, dan **Belum Paham**, serta menampilkan soal yang paling banyak salah beserta kesalahan pemahamannya.
4. Guru menekan satu tombol, AI membuat materi lanjutan per kelompok, guru meninjau lalu membagikannya.
5. Siswa menerima materi sesuai kelompoknya, dalam bentuk yang dipilihnya.
6. Guru melihat daftar **Perlu Pendampingan** untuk siswa yang berulang kali tertinggal.

---

## 2. Latar Belakang dan Masalah

**Pernyataan masalah:** Guru SMP kesulitan mengetahui siswa mana yang tertinggal di tengah pembelajaran karena menangani lebih dari 30 siswa per kelas dan beberapa kelas sekaligus, sehingga kesenjangan pemahaman baru terlihat saat ulangan dan siswa yang tertinggal kehilangan semangat belajar.

**Asal masalah:** pengamatan tim saat PLP (Pengenalan Lapangan Persekolahan). Siswa dalam satu kelas memiliki kesiapan belajar yang berbeda, sementara guru mengajar dengan satu pendekatan untuk semua.

**Hambatan guru yang dijawab produk:**

| Hambatan | Dijawab oleh |
| --- | --- |
| Siswa tertinggal baru diketahui saat ulangan | Kuis singkat + dasbor hasil pada hari yang sama (F-3, F-5) |
| Tidak sempat menyiapkan beberapa versi materi | Materi lanjutan AI per kelompok (F-6) |
| Siswa yang kesulitan diam dan malu bertanya | Terdeteksi dari jawaban kuis, bukan dari keberanian bertanya (F-5) |
| Siswa yang terus tertinggal kehilangan semangat | Perlu Pendampingan (F-8) dan pilihan bentuk materi (F-2) |

---

## 3. Tujuan dan Ukuran Keberhasilan

| ID | Ukuran | Target | Cara membuktikan |
| --- | --- | --- | --- |
| G-1 | Waktu guru menjalankan satu siklus (buka kuis → lihat hasil → bagikan materi) | < 5 menit | Diukur saat latihan demo |
| G-2 | Waktu siswa menyelesaikan kuis 5 soal | < 3 menit | Diukur saat latihan demo |
| G-3 | Guru dapat menyebut siswa yang belum paham setelah membuka halaman hasil | ≤ 3 detik | Uji ke 1–2 guru |
| G-4 | Alur inti langkah 1–5 berjalan tanpa error di 3 HP berbeda | 100% | Checklist akhir di `agenda.md` |

Bukan tujuan prototipe: membuktikan kenaikan nilai jangka panjang. Itu target uji coba lapangan setelah hackathon.

---

## 4. Pengguna

| Pengguna | Gambaran | Perangkat | Akses |
| --- | --- | --- | --- |
| Guru (utama) | Bu Rina, guru matematika kelas 7, mengajar beberapa kelas | Laptop, 1280–1440px | Membuka `/guru`, tanpa login |
| Siswa (kedua) | Siswa kelas 7 SMP, usia 12–13 tahun, boleh memakai HP di kelas | HP, 360–430px | Kode kelas atau QR, lalu memilih nama dari daftar |

---

## 5. Keputusan Produk yang Dikunci

Keputusan ini final. **Jangan diubah tanpa persetujuan tim.**

| ID | Keputusan | Alasan |
| --- | --- | --- |
| D-1 | Produk **tidak** mendiagnosis "gaya belajar". Pilihan bentuk materi hanya preferensi yang bisa diganti kapan saja. | Anggapan bahwa siswa lebih paham bila diajar sesuai gaya belajarnya tidak didukung penelitian. |
| D-2 | Siswa **tidak pernah melihat** label kelompoknya. Yang tampil ke siswa hanya "Materi untukmu". | Mengurangi risiko siswa merasa dicap. |
| D-3 | Kelompok dihitung ulang setiap kuis, **bukan** label permanen siswa. | Pengelompokan bersifat sementara. |
| D-4 | Materi kelompok Belum Paham adalah **penguatan konsep** agar bisa mengejar, bukan versi yang terus dipermudah. | Mencegah kesenjangan melebar. |
| D-5 | Materi AI selalu **draf** sampai guru menekan "Bagikan ke Siswa". | Guru memegang kendali atas isi. |
| D-6 | Seluruh teks antarmuka berbahasa Indonesia, bernada mendukung dan tidak menghakimi. | Konteks pengguna. |

---

## 6. Ruang Lingkup

### 6.1 Dibangun

| ID | Fitur | Prioritas |
| --- | --- | --- |
| F-1 | Siswa bergabung dengan kode/QR dan memilih nama | Wajib |
| F-2 | Siswa memilih bentuk materi awal | Wajib |
| F-3 | Siswa mengerjakan kuis 5 soal | Wajib |
| F-4 | Guru membuka dan menutup kuis, menampilkan kode + QR | Wajib |
| F-5 | Dasbor hasil: tiga kelompok + soal paling banyak salah | Wajib |
| F-6 | Materi lanjutan AI: buat, tinjau, ubah, bagikan | Wajib |
| F-7 | Siswa melihat "Materi untukmu" | Wajib |
| F-8 | Perlu Pendampingan + Mengalami Kemajuan (data simulasi) | Tambahan, setelah F-1 s.d. F-7 selesai |

### 6.2 Tidak dibangun

- Login, akun, atau autentikasi.
- Banyak kelas, banyak guru, atau banyak mata pelajaran (hanya 1 kelas dan 1 topik contoh).
- Halaman guru untuk membuat atau mengedit soal (soal berasal dari data awal).
- Aplikasi Android/iOS, mode tanpa internet, input jawaban dari kertas.
- Pembuatan video atau file audio oleh AI.
- Integrasi Google Classroom, Platform Merdeka Mengajar, atau sistem sekolah.
- Tombol "Saya belum paham", tutor sebaya, ekspor nilai.
- Diagnosis gaya belajar dalam bentuk apa pun.

---

## 7. Kebutuhan Fungsional

Format: cerita pengguna (US), lalu kriteria penerimaan (AC) yang bisa diuji. Rute dan kontrak API ada di `architecture.md`; tampilan di `design.md`.

### F-1 Gabung kelas (siswa)

**US-1:** Sebagai siswa, saya ingin bergabung ke kuis dengan kode kelas agar bisa mulai tanpa membuat akun.

- AC-1.1: Halaman `/siswa` menampilkan input kode kelas. Jika URL berisi `?kode=A7K2P`, input terisi otomatis.
- AC-1.2: Kode diubah otomatis menjadi huruf kapital dan spasi dihapus.
- AC-1.3: Kode tidak ditemukan → "Kode kelas tidak ditemukan. Periksa lagi kode dari gurumu."
- AC-1.4: Kode sesi yang sudah ditutup → "Kuis ini sudah ditutup."
- AC-1.5: Kode valid → daftar nama siswa kelas tersebut, urut abjad, untuk dipilih.
- AC-1.6: Setelah memilih nama, siswa diarahkan ke `/siswa/format`. Identitas siswa diingat di perangkat itu.
- AC-1.7: Halaman siswa lainnya mengarahkan kembali ke `/siswa` jika identitas siswa belum ada.

### F-2 Pilih bentuk materi (siswa)

**US-2:** Sebagai siswa, saya ingin memilih cara belajar yang saya sukai agar lebih mau mulai belajar.

- AC-2.1: Judul "Kamu lebih suka belajar lewat apa?" dengan empat pilihan: Video, Audio, Bacaan, Latihan.
- AC-2.2: Keterangan "Kamu bisa ganti kapan saja."
- AC-2.3: Pilihan tersimpan, lalu siswa diarahkan ke `/siswa/kuis`.
- AC-2.4: Tidak ada teks "gaya belajar", "tipe visual", atau istilah sejenis.

### F-3 Kuis (siswa)

**US-3:** Sebagai siswa, saya ingin menjawab soal satu per satu dengan nyaman di HP.

- AC-3.1: Satu soal per layar dengan penanda "Soal X dari 5" dan progress bar.
- AC-3.2: Tombol pilihan jawaban lebar penuh, tinggi minimal 52px.
- AC-3.3: "Berikutnya" nonaktif sebelum memilih jawaban. "Sebelumnya" tersedia mulai soal 2.
- AC-3.4: Di soal terakhir, tombol menjadi "Kirim jawaban".
- AC-3.5: Kunci jawaban dan miskonsepsi **tidak pernah** dikirim ke browser siswa.
- AC-3.6: Setelah terkirim → `/siswa/selesai`: "Jawabanmu sudah terkirim. Tunggu gurumu membagikan materi untukmu." Nilai dan kelompok **tidak** ditampilkan.
- AC-3.7: Pengiriman gagal → jawaban tetap di layar dan muncul "Jawaban belum terkirim. Periksa koneksi, lalu coba lagi." dengan tombol "Coba lagi".
- AC-3.8: Mengirim ulang untuk sesi yang sama menimpa jawaban sebelumnya, tanpa data ganda.

### F-4 Buka dan tutup kuis (guru)

**US-4:** Sebagai guru, saya ingin membuka kuis dan menampilkan kode agar siswa bisa langsung bergabung.

- AC-4.1: Halaman `/guru` menampilkan daftar sesi Kelas 7A (terbaru di atas, dengan jumlah siswa yang menjawab) dan tombol "Buka kuis baru".
- AC-4.2: Kuis baru mendapat kode 5 karakter yang mudah dibaca (tanpa huruf I, O dan angka 0, 1) dan belum pernah dipakai.
- AC-4.3: Membuka kuis baru otomatis menutup kuis lain yang masih aktif di kelas yang sama.
- AC-4.4: Setelah dibuat, tampil kode kelas berukuran besar, QR code menuju halaman gabung siswa dengan kode terisi, dan tombol "Lihat hasil".
- AC-4.5: Tombol "Tutup kuis" membuat kuis tidak bisa lagi menerima jawaban.

### F-5 Dasbor hasil (guru)

**US-5:** Sebagai guru, saya ingin langsung tahu siapa yang belum paham agar bisa segera menindaklanjuti.

- AC-5.1: Menampilkan nama kelas, topik, tanggal, dan "X dari 32 siswa menjawab".
- AC-5.2: Tiga kartu kelompok dengan jumlah siswa, plus donut chart; setiap segmen berlabel teks.
- AC-5.3: Daftar siswa per kelompok beserta skor (misalnya `4/5`), urut abjad.
- AC-5.4: Kartu "Soal paling banyak salah": nomor soal, persentase salah, dan kesalahan pemahaman dari pilihan salah yang paling sering dipilih. Tanpa jawaban → "Belum ada jawaban masuk."
- AC-5.5: Data diperbarui otomatis tanpa memuat ulang halaman, paling lambat 3 detik setelah siswa mengirim jawaban.
- AC-5.6: Tombol "Buat Materi Lanjutan dengan AI" adalah elemen paling menonjol, nonaktif jika belum ada jawaban.
- AC-5.7: Jika ada kelompok berisi siswa tetapi belum punya materi (misalnya siswa baru menjawab setelah materi dibuat), tampil pemberitahuan "Ada siswa yang belum mendapat materi" dengan tombol "Buat materi yang kurang".
- AC-5.8: Tautan "Lihat siswa yang perlu pendampingan" menuju `/guru/pendampingan`.

### F-6 Materi lanjutan AI (guru)

**US-6:** Sebagai guru, saya ingin materi berbeda untuk tiap kelompok dibuat otomatis, lalu saya periksa sebelum dibagikan.

- AC-6.1: Materi hanya dibuat untuk kelompok yang memiliki minimal 1 siswa.
- AC-6.2: Selama proses tampil "Menyusun materi untuk kelompok…" dan tombol tidak bisa ditekan dua kali. Jika guru lain (atau tab lain) sedang membuat materi untuk sesi yang sama, tampil "Materi sedang dibuat. Tunggu sebentar."
- AC-6.3: Jika pembuatan gagal → "Materi belum berhasil dibuat." dengan tombol "Coba lagi" dan "Gunakan materi cadangan".
- AC-6.4: "Gunakan materi cadangan" memuat materi yang ditulis manual oleh tim.
- AC-6.5: Halaman `/guru/materi?sesi=` menampilkan kartu Penguatan Konsep (Belum Paham), Latihan Terarah (Setengah Paham), Tantangan (Sudah Paham), masing-masing dengan jumlah siswa dan label sumber ("Dibuat AI" atau "Materi cadangan").
- AC-6.6: Guru dapat mengubah ringkasan bacaan, naskah audio, dan setiap soal latihan, lalu menyimpan.
- AC-6.7: Jika materi sudah diubah di tab lain sejak halaman dibuka, penyimpanan ditolak dengan pesan "Materi sudah berubah. Muat ulang untuk melihat versi terbaru."
- AC-6.8: Label "Periksa dan sesuaikan materi sebelum dibagikan." tampil di atas kartu.
- AC-6.9: "Bagikan ke Siswa" membagikan semua materi sesi dan menampilkan "Materi sudah dibagikan."
- AC-6.10: Materi draf bisa dibuat ulang setelah konfirmasi "Materi draf akan diganti." Materi yang sudah dibagikan **tidak** bisa dibuat ulang.

### F-7 Materi untukmu (siswa)

**US-7:** Sebagai siswa, saya ingin menerima materi yang sesuai dalam bentuk yang saya pilih.

- AC-7.1: Sebelum materi dibagikan: "Materimu sedang disiapkan gurumu." Halaman memeriksa ulang otomatis.
- AC-7.2: Setelah dibagikan: judul "Materi untukmu: Pecahan Senilai" dan tab Video, Audio, Bacaan, Latihan. Tab pertama yang terbuka sesuai pilihan di F-2.
- AC-7.3: Tab Bacaan menampilkan ringkasan bacaan.
- AC-7.4: Tab Audio menampilkan naskah dan tombol "Dengarkan" yang membacakan teks dengan suara bawaan browser berbahasa Indonesia. Jika browser tidak mendukung, tombol disembunyikan.
- AC-7.5: Tab Video menampilkan ide video dan tautan "Cari video di YouTube". Tidak ada video yang dibuat.
- AC-7.6: Tab Latihan berisi soal interaktif; setelah menjawab, siswa melihat benar/salah dan pembahasan.
- AC-7.7: Nama kelompok siswa tidak pernah dikirim ke browser siswa (keputusan D-2).
- AC-7.8: Siswa yang belum mengirim jawaban melihat "Kamu belum mengerjakan kuis ini." dan tombol menuju kuis.

### F-8 Perlu Pendampingan (guru)

**US-8:** Sebagai guru, saya ingin tahu siswa yang terus tertinggal sebelum mereka kehilangan semangat.

- AC-8.1: Halaman memuat label "Hanya terlihat oleh guru".
- AC-8.2: Aturan dihitung atas 3 sesi terakhir kelas. Sesi yang sama sekali tidak memiliki jawaban tidak dihitung. Sesi yang masih aktif hanya diperhitungkan untuk siswa yang sudah menjawab di sesi itu.
- AC-8.3: Alasan masuk daftar (satu siswa bisa punya lebih dari satu):
  - "Belum paham 3x berturut-turut": Belum Paham di 3 sesi terakhir yang diikutinya.
  - "Tidak mengerjakan 2 cek terakhir": tidak menjawab di 2 sesi terakhir yang sudah ditutup.
  - "Skor menurun 3 kali berturut-turut": skor turun berurutan di 3 sesi terakhir yang diikutinya.
- AC-8.4: Setiap baris berisi nama, alasan, tren skor, dan saran tindakan:
  - Belum paham → "Beri materi penguatan konsep dan dampingi langsung."
  - Tidak mengerjakan → "Ajak bicara untuk mengetahui kendalanya."
  - Skor menurun → "Periksa topik terakhir yang sulit baginya."
- AC-8.5: Bagian "Mengalami Kemajuan": siswa yang sebelumnya Belum Paham dan pada sesi terakhir yang diikutinya naik ke Setengah atau Sudah Paham.
- AC-8.6: Dengan data demo di bagian 8.5, hasilnya **tepat**: Budi Santoso, Sari Wulandari, Rizky Pratama di daftar; Dimas Saputra di Mengalami Kemajuan; tidak ada siswa lain.

---

## 8. Konten Demo

Gunakan data **tetap**, bukan acak, agar demo selalu sama. Implementasinya di `architecture.md` bagian 5.

### 8.1 Kelas dan topik

- Kelas: `Kelas 7A`, mapel `Matematika`, guru `Bu Rina`.
- Topik: `Pecahan Senilai`, capaian pembelajaran: `Peserta didik dapat menentukan dan membandingkan pecahan senilai.`

### 8.2 Siswa (40 nama)

Andi Saputra, Budi Santoso, Citra Lestari, Dimas Saputra, Eka Putri, Fajar Nugroho, Gita Permata, Hendra Wijaya, Intan Maharani, Joko Prasetyo, Kartika Sari, Lukman Hakim, Maya Anggraini, Nanda Pratiwi, Oki Ramadhan, Putri Ayu, Rizky Pratama, Salsa Nabila, Sari Wulandari, Taufik Hidayat, Umi Kalsum, Vina Oktaviani, Wahyu Setiawan, Yoga Aditya, Zahra Aulia, Bayu Firmansyah, Dewi Kurnia, Farhan Maulana, Laras Ningrum, Nadia Safitri, Reza Kurniawan, Tiara Anjani, Hana Pertiwi, Jihan Amalia, Kevin Prasetyo, Mira Handayani, Gilang Ramadhan, Ilham Kurniawan, Lestari Wulan, Naufal Rizki.

8 nama terakhir (Hana Pertiwi s.d. Naufal Rizki) adalah siswa baru yang tidak punya hasil di `RIW001`–`RIW003`.

### 8.3 Soal (topik Pecahan Senilai)

Gunakan **persis**. Jangan membuat soal sendiri.

| No | Soal | Pilihan | Kunci | Kesalahan pemahaman pada pilihan salah |
| --- | --- | --- | --- | --- |
| 1 | Pecahan yang senilai dengan 2/3 adalah … | A. 3/4, B. 4/6, C. 4/5, D. 2/6 | B | A: menambah 1 pada pembilang dan penyebut. C: menambah 2 pada pembilang dan penyebut. D: hanya mengalikan penyebut. |
| 2 | 3/4 = …/12. Bilangan yang tepat untuk mengisi titik-titik adalah … | A. 3, B. 11, C. 9, D. 4 | C | A: tidak mengubah pembilang. B: menambahkan selisih penyebut (8) ke pembilang. D: memakai hasil bagi 12 : 3 sebagai pembilang. |
| 3 | Bentuk paling sederhana dari 12/18 adalah … | A. 2/3, B. 6/9, C. 4/6, D. 2/8 | A | B: baru dibagi 2, belum paling sederhana. C: baru dibagi 3, belum paling sederhana. D: mengurangkan 10 dari pembilang dan penyebut. |
| 4 | Pecahan berikut yang TIDAK senilai dengan 1/2 adalah … | A. 3/6, B. 5/10, C. 2/3, D. 4/8 | C | A, B, D: belum mengenali bahwa pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan bilangan yang sama. |
| 5 | Rina makan 2/8 pizza, Budi makan 1/4 pizza yang sama besar. Siapa yang makan lebih banyak? | A. Rina, B. Budi, C. Tidak bisa dibandingkan, D. Sama banyak | D | A: menganggap angka lebih besar berarti nilai lebih besar. B: menganggap penyebut kecil selalu berarti lebih besar. C: menganggap pecahan berpenyebut berbeda tidak bisa dibandingkan. |

### 8.4 Sesi kuis

- 4 sesi riwayat yang sudah ditutup: 7, 14, 21, dan 26 September 2026, kode `RIW001`, `RIW002`, `RIW003`, `RIW004`. Hanya `RIW004` yang juga memiliki jawaban per soal.
- 1 sesi demo aktif: kode `A7K2P`, belum ada jawaban.

### 8.5 Riwayat hasil (untuk F-8)

Semua skor dari total 5.

| Siswa | Sesi 1 | Sesi 2 | Sesi 3 | Sesi 4 | Tujuan |
| --- | --- | --- | --- | --- | --- |
| Budi Santoso | 1 | 2 | 1 | 1 | Memicu "Belum paham 3x berturut-turut" |
| Sari Wulandari | 3 | tidak menjawab | tidak menjawab | tidak menjawab | Memicu "Tidak mengerjakan 2 cek terakhir" |
| Rizky Pratama | 5 | 4 | 3 | 2 | Memicu "Skor menurun 3 kali berturut-turut" |
| Dimas Saputra | 1 | 2 | 4 | tidak menjawab | Muncul di "Mengalami Kemajuan" |
| 28 siswa lain | 5 | 4 | 5 | lihat tabel Sesi 4 | Tidak memicu aturan apa pun |
| 8 siswa baru | tidak ada | tidak ada | tidak ada | lihat tabel Sesi 4 | Tidak memicu aturan apa pun |

Sari Wulandari dan Dimas Saputra sengaja tidak menjawab Sesi 4. Dimas hanya melewatkan 1 dari 2 cek terakhir, sehingga tetap hanya muncul di "Mengalami Kemajuan" (belum paham di Sesi 2 → setengah paham di Sesi 3).

**Sesi 4 (`RIW004`), 38 siswa menjawab:**

| Skor | Siswa |
| --- | --- |
| 5 | Andi Saputra, Citra Lestari, Gita Permata, Intan Maharani, Kartika Sari, Maya Anggraini, Salsa Nabila, Zahra Aulia, Hana Pertiwi, Jihan Amalia |
| 4 | Eka Putri, Fajar Nugroho, Lukman Hakim, Putri Ayu, Vina Oktaviani, Laras Ningrum |
| 3 | Hendra Wijaya, Nanda Pratiwi, Taufik Hidayat, Dewi Kurnia, Nadia Safitri, Kevin Prasetyo |
| 2 | Rizky Pratama, Joko Prasetyo, Oki Ramadhan, Umi Kalsum, Reza Kurniawan, Mira Handayani |
| 1 | Budi Santoso, Wahyu Setiawan, Yoga Aditya, Bayu Firmansyah, Farhan Maulana, Gilang Ramadhan |
| 0 | Tiara Anjani, Ilham Kurniawan, Lestari Wulan, Naufal Rizki |

Jawaban per soal di Sesi 4 (tetap, bukan acak): soal yang dijawab benar adalah s soal pertama dari urutan [1, 2, 4, 3, 5], dengan s = skor. Soal lainnya dijawab salah dengan pilihan tetap: soal 1 → A, soal 2 → A, soal 3 → B, soal 4 → A, soal 5 → A.

---

## 9. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Responsif | Halaman siswa nyaman di lebar 360px; halaman guru untuk 1280–1440px |
| Keterbacaan | Kontras teks minimal 4.5:1; tetap jelas saat diproyeksikan di ruangan terang |
| Aksesibilitas | Fokus keyboard terlihat; area sentuh minimal 48×48px; warna tidak menjadi satu-satunya penanda |
| Kecepatan | Hasil kuis muncul di dasbor paling lambat 3 detik; materi AI selesai dalam 60 detik atau menampilkan pilihan cadangan |
| Keamanan | Kunci jawaban, kunci API, dan nama kelompok tidak pernah sampai ke browser siswa |
| Privasi | Hanya menyimpan nama dan jawaban siswa; nama siswa tidak dikirim ke AI |
| Bahasa | Bahasa Indonesia, nada sesuai `design.md` bagian 6 |

---

## 10. Asumsi yang Masih Bisa Diubah

Nilai ini sudah dipakai sebagai **nilai bawaan**. Ubah sebelum fase terkait di `agenda.md` dikerjakan.

| ID | Asumsi | Nilai bawaan |
| --- | --- | --- |
| A-1 | Jenjang dan mata pelajaran demo | SMP kelas 7, Matematika, Pecahan Senilai |
| A-2 | Batas kelompok | 5/5 Sudah; ≥ 60% Setengah; < 60% Belum |
| A-3 | Mekanisme Perlu Pendampingan | Otomatis berdasarkan aturan, hanya terlihat guru |
| A-4 | Nama produk | **Guru Pintar** (sudah diputuskan) |
| A-5 | Akses halaman guru | Tanpa login (khusus demo) |

---

## 11. Risiko

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Materi AI tidak akurat atau formatnya salah | Bagian utama demo gagal | Validasi format, coba ulang, materi cadangan, tinjauan guru |
| Halaman guru bisa dibuka siapa saja | Data kelas terlihat orang lain | Diterima untuk demo; login masuk rencana pengembangan |
| Internet tempat acara tidak stabil | Demo terhenti | Hotspot cadangan dan video demo |
| Pengelompokan merugikan siswa berkemampuan rendah | Kesenjangan melebar | Keputusan D-2, D-3, D-4 |
| Cakupan membengkak | Fase tidak selesai | Bagian 6.2 dan aturan di `agenda.md` |

---

## 12. Rujukan Penyusunan

- Atlassian, *Product Requirements Document template*: tujuan, asumsi, cerita pengguna, dan ruang lingkup termasuk hal yang tidak dikerjakan.
- Anthropic, *Best practices for Claude Code* (code.claude.com/docs/en/best-practices): spesifikasi mandiri yang menyebut file dan antarmuka, menyatakan hal di luar cakupan, dan diakhiri verifikasi end-to-end.
