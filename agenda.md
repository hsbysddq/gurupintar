# agenda.md: Guru Pintar

| Atribut | Isi |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 27 September 2026 |
| Isi | Project roadmap dan prompting agenda untuk Claude Code |
| Dokumen terkait | `PRD.md`, `architecture.md`, `design.md` |

> **Aturan untuk Claude Code dan tim**
> - Kerjakan fase **berurutan**. Satu fase = satu sesi Claude Code.
> - Fase selesai hanya jika **Definition of Done** terpenuhi, termasuk bukti output `npm run lint`, `npm run build`, dan `npm test`.
> - Jangan mengerjakan fitur dari fase berikutnya lebih awal.

---

## 1. Cara Kerja dengan Claude Code

1. Letakkan `PRD.md`, `architecture.md`, `design.md`, `agenda.md`, dan `CLAUDE.md` (Lampiran A) di root proyek.
2. Awali setiap fase dengan sesi baru, lalu masuk **plan mode** (`Shift+Tab` sampai status bar menampilkan plan mode). Kirim **Prompt Rencana**.
3. Baca rencana Claude. Jika ada yang tidak sesuai dokumen, koreksi di tahap ini (paling murah).
4. Setujui rencana, lalu kirim **Prompt Implementasi**.
5. Kirim **Prompt Verifikasi**. Periksa bukti output, bukan hanya pernyataan "sudah selesai".
6. Lakukan **Cek Manual** di browser/HP.
7. Lakukan **commit manual** dengan pesan yang disediakan di setiap fase, lalu mulai sesi/percakapan baru sebelum fase berikutnya.
8. Jika Claude salah pada hal yang sama dua kali, jalankan `/clear` dan ulangi fase dengan prompt yang lebih spesifik.

---

## 1a. Aturan Commit (Conventional Commits)

Commit **selalu dilakukan manual oleh tim**. Claude Code tidak menjalankan `git add`, `git commit`, atau `git push`.

Format: `tipe(cakupan): deskripsi singkat`, huruf kecil, tanpa titik di akhir, maksimal ±72 karakter. Rincian opsional ditulis di badan pesan (`-m` kedua).

| Tipe | Dipakai untuk |
| --- | --- |
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `refactor` | Perubahan struktur kode tanpa mengubah perilaku |
| `style` | Perubahan tampilan/format tanpa mengubah logika |
| `test` | Menambah atau memperbaiki tes |
| `docs` | Perubahan dokumen (PRD, architecture, design, agenda) |
| `chore` | Pekerjaan pendukung: dependensi, konfigurasi, persiapan demo |

Cakupan yang dipakai: `setup`, `db`, `siswa`, `guru`, `materi`, `ui`, `ai`, `demo`.

Contoh perbaikan di tengah fase: `fix(siswa): tampilkan pesan saat kode kelas tidak ditemukan`.

---

## 2. Roadmap

| Fase | Nama | Fitur PRD | Estimasi | Hari |
| --- | --- | --- | --- | --- |
| 1 | Inisiasi & Database (setup) | Fondasi | 2–3 jam | Hari 1 pagi |
| 2 | Alur Siswa | F-1, F-2, F-3 | 3 jam | Hari 1 siang |
| 3 | Guru: Buka Kuis & Dasbor Hasil | F-4, F-5 | 3 jam | Hari 1 malam |
| 4 | Materi AI | F-6, F-7 | 3–4 jam | Hari 2 pagi |
| 5 | Perlu Pendampingan | F-8 | 1,5 jam | Hari 2 siang (hanya jika fase 1–4 lulus) |
| 6 | Penyempurnaan, Deploy & Persiapan Demo | Semua | 3 jam | Hari 2 siang–sore |

**Titik kunci fitur:** setelah fase 4 selesai (atau paling lambat Hari 2 pukul 11.00), tidak ada fitur baru. Jika waktu habis, fase 5 dilewati dan ditampilkan sebagai desain di slide.

---

## 3. Agenda per Fase

### Fase 1: Inisiasi & Database (setup)

**Tujuan:** proyek berjalan, database siap dengan data demo, token desain terpasang, deploy pertama online.

**Langkah manual sebelum prompt (dilakukan tim):**

```bash
npx create-next-app@latest guru-pintar --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*"
cd guru-pintar
# salin PRD.md, architecture.md, design.md, agenda.md, CLAUDE.md ke folder ini
git init && git add . && git commit -m "chore: inisiasi proyek dan dokumen perencanaan"
```

Buat proyek di Supabase, lalu siapkan nilai untuk `.env.local` (`architecture.md` bagian 2.1).

**Prompt Rencana (plan mode):**

```text
Baca @PRD.md, @architecture.md bagian 1–5, dan @design.md bagian 2 dan 4.1–4.3.
Kita mengerjakan Fase 1 di @agenda.md. Buat rencana untuk:
1. Memasang paket sesuai architecture.md bagian 2 (tidak ada paket lain).
2. Membuat supabase/schema.sql persis sesuai architecture.md bagian 4.
3. Membuat supabase/seed.sql sesuai architecture.md bagian 5 dan PRD.md bagian 8 (32 siswa, 5 soal, 4 sesi, riwayat hasil).
4. Membuat lib/konstanta.ts, lib/tipe.ts, lib/server/supabase.ts, lib/server/respons.ts, .env.example, vitest.config.mts, script "test": "vitest run".
5. Memasang token desain di app/globals.css dan font Plus Jakarta Sans di app/layout.tsx.
6. Membuat komponen LatarPastel, KartuKaca, Tombol, dan halaman beranda "/" dengan dua pilihan: "Saya guru" dan "Saya siswa".
7. Membuat tests/konstanta.test.ts yang memastikan KARAKTER_KODE tidak memuat I, O, 0, dan 1.
Sebutkan file yang akan dibuat. Jangan menulis kode dulu.
```

**Prompt Implementasi:**

```text
Rencana disetujui. Implementasikan Fase 1 sesuai rencana. Jangan membuat halaman atau API lain selain yang disebut.
```

**Prompt Verifikasi:**

```text
Jalankan npm run lint, npm run build, dan npm test. Tampilkan outputnya. Perbaiki akar masalah jika ada yang gagal, jangan menonaktifkan aturan lint atau tes.
Lalu tampilkan isi supabase/seed.sql bagian riwayat hasil dan jelaskan bagaimana data itu memenuhi PRD.md bagian 8.5.
```

**Cek Manual:**

- [ ] Jalankan `schema.sql` lalu `seed.sql` di SQL Editor Supabase tanpa error.
- [ ] Tabel `siswa` berisi 32 baris, `soal` 5 baris, `sesi_kuis` 4 baris, `hasil_siswa` 94 baris (28×3 + Budi 3 + Sari 1 + Rizky 3 + Dimas 3).
- [ ] `npm run dev` menampilkan beranda dengan latar pastel dan dua pilihan.
- [ ] Deploy ke Vercel (isi env di dashboard Vercel) dan beranda tampil di link publik.

**Commit manual (kamu jalankan sendiri di terminal, bukan Claude):**

```bash
git status
git add .
git commit -m "feat(setup): siapkan fondasi proyek, skema database, dan data demo" -m "- pasang dependensi sesuai architecture.md bagian 2
- tambah supabase/schema.sql dan supabase/seed.sql
- tambah konstanta, tipe, klien supabase server, dan helper respons
- pasang token desain, font, LatarPastel, KartuKaca, Tombol
- tambah halaman beranda dan tes konstanta"
```

Sebelum `git add .`, pastikan `git status` tidak menampilkan `.env.local`.

**Definition of Done:** lint, build, test lulus; cek manual terpenuhi; link Vercel aktif.

---

### Fase 2: Alur Siswa (F-1, F-2, F-3)

**Tujuan:** satu siswa bisa bergabung dengan kode `A7K2P`, memilih format, menjawab kuis, dan jawabannya tersimpan.

**Prompt Rencana:**

```text
Baca @PRD.md F-1, F-2, F-3; @architecture.md bagian 6 (endpoint /api/sesi, /api/soal, /api/siswa/format, /api/jawaban), 7.1, 7.4, dan 8.1; @design.md bagian 3.1, 3.6, 4.5, 4.11, 4.12, 4.16, dan 5.
Kita mengerjakan Fase 2 di @agenda.md. Buat rencana untuk:
- lib/pengelompokan.ts + tests/pengelompokan.test.ts (semua kasus di architecture.md 8.1).
- lib/skema-api.ts untuk keempat endpoint.
- Keempat API route.
- lib/sesi-lokal.ts dan lib/api-klien.ts.
- Halaman /siswa, /siswa/format, /siswa/kuis, /siswa/selesai beserta komponennya.
Pastikan kunci jawaban tidak pernah dikirim ke browser. Sebutkan file yang akan dibuat. Jangan menulis kode dulu.
```

**Prompt Implementasi:**

```text
Rencana disetujui. Implementasikan Fase 2. Tulis tes pengelompokan terlebih dulu, pastikan gagal, lalu implementasikan sampai lulus.
```

**Prompt Verifikasi:**

```text
Jalankan npm run lint, npm run build, dan npm test, tampilkan outputnya.
Lalu jalankan npm run dev dan uji dengan curl:
1. GET /api/sesi?kode=A7K2P → harus berisi 32 siswa.
2. GET /api/sesi?kode=XXXXX → harus 404 dengan pesan dari architecture.md.
3. GET /api/soal?sesi=<id sesi A7K2P> → pastikan tidak ada field kunci atau miskonsepsi.
4. POST /api/jawaban dengan jawaban 4 benar untuk satu siswa → { ok: true }.
5. Kirim ulang dengan 2 benar → pastikan hasil_siswa siswa itu berubah menjadi skor 2 kelompok belum dan tidak ada baris jawaban ganda.
6. POST /api/jawaban ke sesi RIW001 → harus 409.
Tampilkan setiap perintah dan responsnya.
```

**Cek Manual:**

- [ ] Dari HP: buka `/siswa?kode=A7K2P`, pilih nama, pilih format, jawab 5 soal, kirim.
- [ ] Baris baru muncul di `jawaban` (5 baris) dan `hasil_siswa` (1 baris) di Supabase.
- [ ] Tab Network di browser tidak menampilkan kunci jawaban.
- [ ] Mematikan internet saat kirim menampilkan pesan "Jawaban belum terkirim…" dan tombol "Coba lagi".

**Commit manual (kamu jalankan sendiri di terminal, bukan Claude):**

```bash
git status
git add .
git commit -m "feat(siswa): tambah alur gabung kelas, pilih format, dan kuis" -m "- tambah api sesi, soal, siswa/format, dan jawaban
- tambah logika pengelompokan beserta tes
- tambah halaman /siswa, /siswa/format, /siswa/kuis, /siswa/selesai"
```

Sebelum `git add .`, pastikan `git status` tidak menampilkan `.env.local`.

**Definition of Done:** lint, build, test lulus; semua uji curl sesuai harapan; cek manual terpenuhi.

---

### Fase 3: Guru — Buka Kuis & Dasbor Hasil (F-4, F-5)

**Tujuan:** guru membuka kuis, menampilkan QR, dan melihat peta kelas yang diperbarui otomatis.

**Prompt Rencana:**

```text
Baca @PRD.md F-4 dan F-5; @architecture.md bagian 6 (endpoint /api/guru/sesi, /api/guru/sesi/tutup, /api/guru/hasil beserta 6.1), 7.2, 7.4, 8.2, 8.3; @design.md bagian 3.1–3.3, 4.4–4.10, 4.16, 5.
Kita mengerjakan Fase 3 di @agenda.md. Buat rencana untuk:
- lib/kode-kelas.ts, lib/soal-tersulit.ts, beserta tesnya.
- hooks/use-polling.ts (AbortController, berhenti saat document.hidden).
- Tiga API route guru di atas, termasuk percobaan ulang kode maksimal 5 kali lewat rpc buka_sesi.
- Halaman /guru dan /guru/hasil beserta KerangkaGuru, PanelKodeKelas, PetaKelas, DonutKelompok, DaftarSiswaKelompok, KartuSoalTersulit.
Tombol "Buat Materi Lanjutan dengan AI" cukup tampil (nonaktif jika belum ada jawaban); fungsinya dikerjakan di Fase 4.
Sebutkan file yang akan dibuat. Jangan menulis kode dulu.
```

**Prompt Implementasi:**

```text
Rencana disetujui. Implementasikan Fase 3. Tulis tes untuk kode-kelas dan soal-tersulit terlebih dulu.
```

**Prompt Verifikasi:**

```text
Jalankan npm run lint, npm run build, dan npm test, tampilkan outputnya.
Lalu uji dengan curl: buat sesi baru lewat POST /api/guru/sesi, pastikan sesi aktif sebelumnya menjadi selesai, dan GET /api/guru/hasil untuk sesi baru mengembalikan jumlahMenjawab 0 dan soalTersulit null.
Kirim 3 jawaban berbeda lewat POST /api/jawaban, lalu tunjukkan respons GET /api/guru/hasil beserta alasan mengapa soalTersulit-nya benar.
```

**Cek Manual:**

- [ ] Klik "Buka kuis baru", pindai QR dari HP, bergabung, dan kirim jawaban.
- [ ] Angka di dasbor bertambah tanpa memuat ulang halaman, paling lambat 3 detik.
- [ ] Urutan kolom peta kelas: Belum, Setengah, Sudah.
- [ ] "Tutup kuis" membuat siswa mendapat pesan "Kuis ini sudah ditutup."
- [ ] Guru bisa menyebut siswa Belum Paham dalam 3 detik (uji ke teman yang belum melihat layar).

**Commit manual (kamu jalankan sendiri di terminal, bukan Claude):**

```bash
git status
git add .
git commit -m "feat(guru): tambah buka kuis dengan kode QR dan dasbor hasil" -m "- tambah api guru/sesi, guru/sesi/tutup, dan guru/hasil
- tambah logika kode kelas dan soal tersulit beserta tes
- tambah hook use-polling dan komponen peta kelas
- tambah halaman /guru dan /guru/hasil"
```

Sebelum `git add .`, pastikan `git status` tidak menampilkan `.env.local`.

**Definition of Done:** lint, build, test lulus; cek manual terpenuhi.

---

### Fase 4: Materi AI (F-6, F-7)

**Tujuan:** guru membuat, meninjau, mengubah, dan membagikan materi; siswa menerima materi sesuai kelompok.

**Prasyarat:** anggota tim bidang pendidikan sudah menulis `data/materi-cadangan.json` sesuai `architecture.md` bagian 9.5 dan memeriksa ketepatan materinya.

**Prompt Rencana:**

```text
Baca @PRD.md F-6 dan F-7; @architecture.md bagian 6 (endpoint /api/guru/materi, /api/guru/materi/bagikan, /api/materi), 7.3, 7.4, 8.5, dan seluruh bagian 9; @design.md bagian 3.4, 3.6, 4.13, 4.14, 5.
Kita mengerjakan Fase 4 di @agenda.md. Buat rencana untuk:
- lib/validasi-materi.ts + tes (termasuk tes bahwa data/materi-cadangan.json lolos periksaIsiMateri, dan tes penolakan frasa label kelompok).
- lib/server/materi-ai.ts dengan instruksi sistem yang disalin persis dari architecture.md 9.3.
- lib/server/materi-cadangan.ts.
- API materi dengan kunci ambil_kunci_materi/lepas_kunci_materi (lepas di finally), aturan kelompok target 7.3, dan optimistic locking versi.
- Halaman /guru/materi dan /siswa/materi beserta komponennya, serta tombol di /guru/hasil yang kini berfungsi (termasuk "Buat materi yang kurang").
Sebutkan file yang akan dibuat. Jangan menulis kode dulu.
```

**Prompt Implementasi:**

```text
Rencana disetujui. Implementasikan Fase 4. Tulis tes validasi-materi terlebih dulu.
```

**Prompt Verifikasi:**

```text
Jalankan npm run lint, npm run build, dan npm test, tampilkan outputnya.
Lalu uji dengan curl pada sesi yang sudah punya jawaban di minimal dua kelompok:
1. POST /api/guru/materi → materi draf untuk kelompok yang berisi siswa saja.
2. Kirim dua POST /api/guru/materi dengan ganti=true secara bersamaan → satu berhasil, satu 409 "Materi sedang dibuat."
3. PATCH dengan versi lama → 409.
4. POST /api/guru/materi/bagikan, lalu GET /api/materi untuk satu siswa → status tersedia, dan pastikan respons tidak memuat nama kelompok.
5. Kosongkan ANTHROPIC_API_KEY sementara, POST /api/guru/materi dengan ganti=true pada sesi lain → 502; lalu dengan gunakanCadangan=true → berhasil dengan sumber cadangan.
Tampilkan setiap perintah dan responsnya.
```

**Cek Manual:**

- [ ] Anggota tim bidang pendidikan membaca materi AI untuk ketiga kelompok dan memastikan tidak ada kesalahan konsep atau kunci jawaban.
- [ ] Materi tampil di HP siswa dengan tab awal sesuai format pilihannya.
- [ ] Tombol "Dengarkan" membacakan naskah di Chrome Android.
- [ ] Tidak ada teks "belum paham", "setengah paham", "sudah paham", atau "kelompok" di layar siswa.

**Commit manual (kamu jalankan sendiri di terminal, bukan Claude):**

```bash
git status
git add .
git commit -m "feat(materi): tambah materi lanjutan AI dan halaman materi siswa" -m "- tambah layanan materi AI, materi cadangan, dan validasi isi materi
- tambah api guru/materi, guru/materi/bagikan, dan materi siswa
- tambah penguncian pembuatan materi dan optimistic locking versi
- tambah halaman /guru/materi dan /siswa/materi"
```

Sebelum `git add .`, pastikan `git status` tidak menampilkan `.env.local`.

**Definition of Done:** lint, build, test lulus; kelima uji curl sesuai harapan; cek manual terpenuhi. **Fitur dikunci setelah fase ini.**

---

### Fase 5: Perlu Pendampingan (F-8)

**Tujuan:** daftar pendampingan dan kemajuan tampil tepat sesuai data demo.

**Prompt Rencana:**

```text
Baca @PRD.md F-8 dan bagian 8.5; @architecture.md bagian 6 (endpoint /api/guru/pendampingan) dan 8.4; @design.md bagian 3.5 dan 4.15.
Kita mengerjakan Fase 5 di @agenda.md. Buat rencana untuk lib/pendampingan.ts beserta tes yang memakai data PRD 8.5 dan tes "sesi tanpa jawaban diabaikan", API route, dan halaman /guru/pendampingan.
Sebutkan file yang akan dibuat. Jangan menulis kode dulu.
```

**Prompt Implementasi:**

```text
Rencana disetujui. Implementasikan Fase 5. Tulis tes terlebih dulu.
```

**Prompt Verifikasi:**

```text
Jalankan npm run lint, npm run build, dan npm test, tampilkan outputnya.
Setelah menjalankan ulang seed.sql, tunjukkan respons GET /api/guru/pendampingan dan cocokkan dengan PRD.md AC-8.6.
```

**Cek Manual:**

- [ ] Halaman menampilkan Budi Santoso, Sari Wulandari, Rizky Pratama di daftar dan Dimas Saputra di Mengalami Kemajuan.
- [ ] Label "Hanya terlihat oleh guru" tampil.

**Commit manual (kamu jalankan sendiri di terminal, bukan Claude):**

```bash
git status
git add .
git commit -m "feat(guru): tambah daftar perlu pendampingan" -m "- tambah logika pendampingan beserta tes
- tambah api guru/pendampingan dan halaman /guru/pendampingan"
```

Sebelum `git add .`, pastikan `git status` tidak menampilkan `.env.local`.

**Definition of Done:** lint, build, test lulus; hasil sesuai AC-8.6.

---

### Fitur tambahan setelah Fase 5

Dikerjakan setelah F-1 s.d. F-8 selesai. Masing-masing punya rencana dan verifikasi (lint, build, test) sendiri.

- **Ubah Modul (PRD F-9):** guru menempelkan teks modul matematika kelas 7 di `/guru/modul` dan melihat pratinjaunya dalam empat bentuk belajar, agar guru bisa memakai modul yang sudah dimilikinya tanpa menyusun materi dari awal.
- **Buat Soal (PRD F-10):** guru membuat topik baru berisi 5 soal di `/guru/soal` lalu memilihnya saat membuka kuis, agar Guru Pintar tidak terbatas pada topik demo Pecahan Senilai.
- **Landing page (`design.md` 3.10):** halaman `/` menjelaskan masalah, cara kerja, fitur, dan prinsip Guru Pintar dengan donut kelompok sebagai visual utama, agar juri dan guru memahami produk sebelum mencobanya.

---

### Fase 6: Penyempurnaan, Deploy & Persiapan Demo

**Tujuan:** aplikasi stabil untuk demo, semua keadaan layar tertangani, dan tim siap presentasi.

**Prompt Rencana:**

```text
Baca @design.md bagian 5, 6, dan 7, serta @PRD.md bagian 9.
Kita mengerjakan Fase 6 di @agenda.md. Periksa semua halaman dan buat daftar temuan terhadap checklist design.md bagian 7 dan aturan design.md bagian 5 (keadaan memuat/gagal/kosong, aksesibilitas, teks, token warna). Jangan menambah fitur baru. Jangan menulis kode dulu.
```

**Prompt Implementasi:**

```text
Perbaiki temuan yang memengaruhi kebenaran, keterbacaan, atau aksesibilitas saja. Abaikan preferensi gaya yang tidak tercantum di design.md.
```

**Prompt Review (sesi atau subagent terpisah):**

```text
Gunakan subagent untuk meninjau seluruh perubahan terhadap @PRD.md dan @architecture.md.
Periksa: setiap AC yang wajib sudah terpenuhi, kunci jawaban dan nama kelompok tidak pernah dikirim ke browser siswa, kunci rahasia hanya di server, dan tidak ada perubahan di luar cakupan.
Laporkan hanya celah yang memengaruhi kebenaran atau kebutuhan, bukan preferensi gaya.
```

**Prompt Verifikasi:**

```text
Jalankan npm run lint, npm run build, dan npm test, tampilkan outputnya.
```

**Langkah manual:**

1. Setelah commit manual, jalankan `git push`. Vercel akan otomatis membangun ulang; pastikan status build di dashboard Vercel berhasil.
2. Jalankan ulang `seed.sql` untuk mereset data demo.
3. Uji alur penuh dengan checklist bagian 5 di 3 HP berbeda.
4. Rekam video demo lengkap sebagai cadangan.

**Commit manual (kamu jalankan sendiri di terminal, bukan Claude):**

```bash
git status
git add .
git commit -m "chore(demo): sempurnakan keadaan layar dan siapkan demo" -m "- lengkapi keadaan memuat, gagal, dan kosong
- perbaiki temuan aksesibilitas dan keterbacaan"
```

Sebelum `git add .`, pastikan `git status` tidak menampilkan `.env.local`.

**Definition of Done:** checklist bagian 5 terpenuhi; video cadangan tersimpan.

---

## 4. Pekerjaan Paralel Non-Coding

| Waktu | Desain UI/UX | Pendidikan/konten | Pitching |
| --- | --- | --- | --- |
| Fase 1–2 | Finalisasi tampilan di Google Stitch sesuai `design.md` | Periksa ulang soal dan miskonsepsi di PRD 8.3 | Wawancara guru pamong PLP dan 2–4 guru lain |
| Fase 3 | Cek konsistensi visual dasbor | Tulis `data/materi-cadangan.json` | Susun slide masalah, cerita PLP, dasar riset |
| Fase 4 | Cek tampilan materi di HP | Periksa materi AI ketiga kelompok | Susun slide solusi dan demo |
| Fase 5–6 | Rekam video demo | Uji alur sebagai siswa | Latihan pitching dengan pengatur waktu, simulasi tanya jawab |

---

## 5. Checklist Akhir Sebelum Demo

- [ ] Data demo sudah direset dengan `seed.sql`.
- [ ] Alur guru dan siswa berjalan penuh di 3 HP berbeda.
- [ ] Guru dapat menyebut siswa Belum Paham dalam 3 detik.
- [ ] Siswa tidak pernah melihat label kelompoknya.
- [ ] Kunci jawaban tidak muncul di tab Network browser siswa.
- [ ] Tombol "Gunakan materi cadangan" berfungsi.
- [ ] Halaman Perlu Pendampingan sesuai AC-8.6 (jika fase 5 dikerjakan).
- [ ] Semua teks terbaca saat diproyeksikan.
- [ ] Hotspot cadangan dan video demo siap.
- [ ] Link aplikasi, repositori GitHub, dan pitch deck siap dikumpulkan.

---

## 6. Prompt Cadangan

**Saat build atau tes gagal:**

```text
Build gagal dengan error berikut: [tempel error]. Temukan akar masalahnya dan perbaiki. Jangan menonaktifkan aturan atau tes. Jalankan ulang npm run build dan npm test, tampilkan outputnya.
```

**Saat tampilan tidak sesuai desain:**

```text
[tempel screenshot] Bandingkan halaman ini dengan @design.md bagian [nomor]. Sebutkan perbedaannya, lalu perbaiki hanya perbedaan tersebut.
```

**Saat Claude keluar dari cakupan:**

```text
Batalkan perubahan di luar Fase [n]. Kerjakan hanya yang tercantum di @agenda.md Fase [n].
```

---

## Lampiran A. `CLAUDE.md`

Simpan sebagai `CLAUDE.md` di root proyek. Buat tetap pendek.

```markdown
# Guru Pintar
Dokumen acuan (baca hanya bagian yang dirujuk di prompt): PRD.md (kebutuhan), architecture.md (teknis), design.md (UI), agenda.md (urutan fase).
Kerjakan hanya fase yang sedang aktif. Jika ada yang tidak jelas, tanyakan.

# Perintah
- npm run dev | npm run lint | npm run build | npm test

# Aturan
- IMPORTANT: SUPABASE_SERVICE_ROLE_KEY dan ANTHROPIC_API_KEY hanya di lib/server/* dan app/api/*.
- Browser tidak pernah mengakses Supabase langsung; semua lewat app/api.
- Jangan kirim kunci jawaban, miskonsepsi, atau nama kelompok ke browser siswa.
- Jangan menambah paket di luar architecture.md bagian 2 tanpa bertanya.
- API route tanpa segmen dinamis; gunakan query string.
- Warna hanya dari token design.md; tidak ada hex di className.
- Semua teks UI berbahasa Indonesia.
- Fungsi logika di lib/ wajib punya tes vitest.
- Selesai = lint, build, test lulus, dengan bukti output.
- IMPORTANT: Jangan menjalankan git add, git commit, atau git push. Commit dilakukan manual oleh pengguna.
```
