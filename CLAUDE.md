@AGENTS.md

# Guru Pintar
Dokumen acuan (baca hanya bagian yang dirujuk di prompt): PRD.md (kebutuhan), architecture.md (teknis), design.md (UI), agenda.md (urutan fase).
Kerjakan hanya fase yang sedang aktif. Jika ada yang tidak jelas, tanyakan.

# Perintah
- npm run dev | npm run lint | npm run build | npm test

# Aturan
- IMPORTANT: SUPABASE_SERVICE_ROLE_KEY dan ANTHROPIC_API_KEY hanya di lib/server/* dan app/api/*.
- Browser tidak pernah mengakses Supabase langsung; semua lewat app/api.
- Jangan kirim kunci jawaban kuis, miskonsepsi, atau nama kelompok ke browser siswa.
- Jangan menambah paket di luar architecture.md bagian 2 tanpa bertanya.
- API route tanpa segmen dinamis; gunakan query string.
- Warna hanya dari token design.md; tidak ada hex di className.
- Semua teks UI berbahasa Indonesia.
- Fungsi logika di lib/ wajib punya tes vitest.
- Selesai = lint, build, test lulus, dengan bukti output.
- IMPORTANT: Jangan menjalankan git add, git commit, atau git push. Commit dilakukan manual oleh pengguna.