# Migrasi sekolah dan ujian

Jalankan **setelah** database awal sudah ada. Jangan menjalankan ulang
`supabase/schema.sql` pada database yang berisi data karena file itu melakukan
`drop table`.

## Urutan

1. Buka Supabase SQL Editor.
2. Jalankan `supabase/migrasi-sekolah.sql`.
3. Jalankan `supabase/migrasi-ujian.sql`.
4. Buat akun super-admin dengan salah satu cara:
   - **Lewat UI**: isi `KODE_UNDANGAN_SUPER_ADMIN` di `.env.local`, lalu buka
     `/daftar/super-admin` dan masukkan kode tersebut.
   - **Lewat script bootstrap** (cadangan):
     ```env
     SUPER_ADMIN_NAMA=Nama Super Admin
     SUPER_ADMIN_EMAIL=superadmin@example.com
     SUPER_ADMIN_PASSWORD=minimal-8-karakter
     ```
     ```bash
     node --env-file=.env.local scripts/buat-super-admin.mjs
     ```
5. Setelah akun super-admin dibuat, kosongkan/rotasi
   `KODE_UNDANGAN_SUPER_ADMIN` agar pendaftaran tertutup.
6. Masuk sebagai super-admin, buat sekolah dan admin pertama.
7. Admin sekolah membuat akun guru dan siswa.

## Setelah migrasi

- Registrasi publik `/daftar/guru` dan `/daftar/siswa` ditutup.
- Semua pengguna/kelas lama masuk ke **Sekolah Default**.
- Guru membuat kelas seperti biasa; admin tidak membuat kelas.
- Ujian dibuat guru dari menu **Ujian** di sidebar guru.
- Siswa masuk lewat **Ujian** di beranda, memasukkan token sekali, lalu timer
  berjalan sampai batas durasi atau jam tutup ujian.
- Guru menilai esai dan merilis hasil.
- Admin sekolah dapat membuka peserta ujian yang diblokir.

## Yang perlu diuji

1. Super-admin membuat dua sekolah dan satu admin untuk masing-masing.
2. Admin sekolah A tidak bisa melihat akun/ujian sekolah B.
3. Admin membuat guru dan siswa; siswa bisa masuk kelas.
4. Guru membuat ujian dengan pilihan ganda, pilihan ganda kompleks, dan esai.
5. Token salah ditolak; token benar memulai timer; siswa tidak bisa mengulang.
6. Tiga pelanggaran memblokir peserta; admin bisa membuka blokir.
7. Guru merilis hasil; siswa baru bisa melihat nilai setelah rilis.
