# Taste — Command Code
- Berkomunikasi dalam Bahasa Indonesia; mengharapkan balasan dan penjelasan dalam Bahasa Indonesia (termasuk ringkasan dan catatan). Confidence: 0.7
- Mengharapkan artefak setup benar-benar dibuat (mis. file `.env.local`/template env berisi placeholder dan komentar sumber nilainya), bukan sekadar instruksi agar pengguna membuatnya sendiri. Confidence: 0.55
- Setelah ia mengisi konfigurasi/menjalankan SQL sendiri, ia minta agen memverifikasi langsung ke layanan nyata ("coba cek ... apakah sudah benar") — bukan percaya pada klaimnya; verifikasi cukup melaporkan status terisi/kosong dan hasil uji nyata tanpa membocorkan nilai rahasia. Confidence: 0.65
- Verifikasi berlangsung iteratif: setelah ia memperbaiki nilai/kunci yang dilaporkan salah, ia minta "coba cek lagi", jadi pemeriksaan sebaiknya disimpan sebagai skrip yang bisa dijalankan ulang dan hasilnya dilaporkan per-butir (lulus/gagal + ringkasan). Confidence: 0.6
- Fitur yang belum selesai boleh dibiarkan tanpa kredensial pihak ketiga: kunci API (mis. Anthropic) diisi belakangan, dan aplikasi harus tetap berfungsi/terdegradasi dengan rapi saat kunci kosong. Confidence: 0.55
- Mengutamakan keamanan nyata (otorisasi berbasis peran yang diverifikasi di server), bukan sekadar menyembunyikan tombol/halaman di UI atau pengamanan demo. Confidence: 0.6
- Melakukan commit git sendiri secara manual; yang ia minta dari agen hanyalah draf pesan commit (tanpa menjalankan `git commit`). Confidence: 0.6
- Menyukai pesan commit bergaya Conventional Commits (`feat(scope): ringkasan`), dengan body berupa daftar butir perubahan, dan opsi versi satu baris. Confidence: 0.7
