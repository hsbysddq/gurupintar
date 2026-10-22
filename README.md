# Guru Pintar

Aplikasi kelas untuk guru matematika SMP: siswa mengerjakan kuis 5 soal dari HP, guru melihat peta pemahaman kelas secara langsung, lalu membagikan materi lanjutan per kelompok.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Anthropic API untuk materi lanjutan (dengan materi cadangan)
- Vitest untuk unit test

## Setup

1. Pasang dependensi.

   ```bash
   npm install
   ```

2. Buat proyek Supabase, lalu salin `.env.example` menjadi `.env.local` dan isi:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ANTHROPIC_API_KEY=
   ANTHROPIC_MODEL=
   KODE_UNDANGAN_GURU=
   ```

   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` adalah kunci anon/publishable dari Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` dan `ANTHROPIC_API_KEY` hanya boleh ada di server.
   - `KODE_UNDANGAN_GURU` wajib untuk pendaftaran guru. Jika kosong, pendaftaran guru ditutup.

3. Jalankan `supabase/schema.sql`, lalu `supabase/seed.sql` di SQL Editor Supabase.
   `schema.sql` bersifat destruktif dan hanya untuk menyiapkan/reset database demo.
   Jika database sudah berisi data, jalankan `supabase/migrasi-arsip-kelas.sql`,
   `supabase/migrasi-identitas-siswa.sql`, dan `supabase/migrasi-ubah-topik.sql` untuk
   menambah kolom arsip, identitas siswa per kelas, serta fungsi ubah topik.

4. Jalankan aplikasi.

   ```bash
   npm run dev
   ```

## Akun demo

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Guru | `guru@demo.gurupintar.id` | `GuruPintar123!` |
| Siswa 1–40 | `siswa1@demo.gurupintar.id` … `siswa40@demo.gurupintar.id` | `SiswaPintar123!` |

Kode undangan kelas demo: `KEL7A`. Kode sesi kuis aktif: `A7K2P`.

## Alur utama

1. Guru masuk di `/masuk`, lalu membuka kuis di `/guru`.
2. Siswa masuk di `/masuk` (atau mendaftar di `/daftar/siswa`), memasukkan kode sesi, memilih format belajar, dan menjawab.
3. Dasbor guru memperbarui peta kelas setiap 3 detik.
4. Guru membuat/meninjau materi AI per kelompok, lalu membagikannya.
5. Siswa melihat materi di `/siswa/materi` tanpa pernah melihat label kelompok.

## Keamanan

- Guru dan siswa memakai akun Supabase Auth dengan peran di `app_metadata` (tidak bisa diubah dari browser).
- Sesi disimpan di cookie dan diverifikasi di server (`getUser()`), bukan hanya di proxy.
- Setiap API guru memeriksa kepemilikan kelas/sesi/materi; setiap API siswa memeriksa keanggotaan kelas.
- Nama siswa unik per kelas (tidak peka huruf besar-kecil), email akun terlihat oleh guru, dan guru bisa mengeluarkan siswa dari kelas.
- Kunci jawaban, miskonsepsi, label kelompok, dan daftar siswa sekelas tidak pernah dikirim ke browser siswa.
- Detail arsitektur dan batasan ada di `architecture.md` bagian 12.

## Perintah

```bash
npm run dev     # server pengembangan
npm run lint    # ESLint
npm run build   # build produksi + cek tipe
npm test        # unit test vitest
npm run test:e2e # tes alur utama ke aplikasi yang sedang berjalan
```

## Pengujian

- `npm test` menjalankan unit test dan tidak membutuhkan server atau database.
- `npm run test:e2e` membutuhkan aplikasi yang sedang berjalan (`BASE_URL`, default
  `http://localhost:3000`) serta `NEXT_PUBLIC_SUPABASE_URL` dan
  `SUPABASE_SERVICE_ROLE_KEY`. Database harus sudah di-seed dengan `seed.sql`.
  Tes membuat satu kelas sementara, menguji login/peran, gabung kelas, buka kuis,
  riwayat sesi, dan arsip, lalu menghapus kelas itu kembali.
- `.github/workflows/ci.yml` menjalankan lint, unit test, dan build pada push/PR.
- `.github/workflows/e2e.yml` dijalankan manual dan memerlukan secrets
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  dan `KODE_UNDANGAN_GURU`.

## Struktur singkat

```text
app/            halaman dan API route
components/     komponen UI
hooks/          use-polling, use-buat-materi, use-sesi-aktif
lib/            logika murni + klien API browser
lib/server/     Supabase service role, Auth, AI, materi cadangan
supabase/       schema.sql dan seed.sql
tests/          unit test vitest
proxy.ts        penyegaran sesi Next.js 16
```
