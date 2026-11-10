# Reset kata sandi lewat email

Fitur lupa kata sandi memakai OTP recovery dari Supabase Auth. Aplikasi tidak
menyimpan kode atau kata sandi sendiri.

## 1. Ubah template email

1. Buka Supabase Dashboard > Authentication > Email Templates.
2. Pilih **Reset Password**.
3. Ganti isi template dengan isi `supabase/template-reset-sandi.html`.
4. Pastikan template memuat `{{ .Token }}`. Jangan hanya memakai
   `{{ .ConfirmationURL }}` karena aplikasi meminta kode 6 digit.

## 2. Pasang SMTP produksi

Email bawaan Supabase dibatasi sekitar **2 email per jam per project**. Sebelum
dipakai banyak guru/siswa, pasang custom SMTP:

1. Buka Supabase Dashboard > Authentication > SMTP Settings.
2. Isi host, port, username, password, dan alamat pengirim dari provider seperti
   Resend, Brevo, Mailgun, atau Postmark.
3. Kirim email uji dari dashboard.

Tanpa SMTP sendiri, fitur ini hanya cocok untuk uji coba dan akan sering gagal
karena rate limit.

## 3. Atur URL aplikasi

1. Buka Authentication > URL Configuration.
2. Isi **Site URL** dengan alamat produksi, misalnya
   `https://gurupintar.example.com`.
3. Tambahkan `https://gurupintar.example.com/masuk` ke **Redirect URLs**.
4. Isi `NEXT_PUBLIC_SITE_URL` di `.env.local` server dengan alamat yang sama.

## 4. Alur pengguna

1. Pengguna membuka `/masuk`, lalu memilih **Lupa kata sandi?**
2. Pengguna memasukkan email terdaftar di `/lupa-sandi`.
3. Supabase mengirim kode 6 digit ke email.
4. Pengguna memasukkan kode dan kata sandi baru di `/atur-sandi`.
5. Setelah berhasil, semua sesi lama dicabut dan pengguna masuk lagi.

Respons pengiriman kode selalu generik agar orang tidak bisa menebak email mana
yang terdaftar.
