@AGENTS.md

# Guru Pintarku
Dokumen acuan (baca hanya bagian yang dirujuk di prompt): PRD.md (kebutuhan), architecture.md (teknis), design.md (UI), agenda.md (urutan fase).
Kerjakan hanya fase yang sedang aktif. Jika ada yang tidak jelas, tanyakan.

# Perintah
- npm run dev | npm run lint | npm run build | npm test

# Aturan
- IMPORTANT: SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, dan KODE_UNDANGAN_GURU hanya di lib/server/* dan app/api/*.
- Browser tidak pernah mengakses Supabase langsung; semua data lewat app/api. Supabase Auth hanya lewat app/api/auth/* dan lib/server/auth.ts.
- Peran pengguna hanya dari app_metadata + tabel pengguna di server; jangan pernah menerima peran dari body/query browser.
- Setiap API guru wajib memeriksa kepemilikan kelas/sesi/materi; setiap API siswa wajib memeriksa keanggotaan kelas.
- Identitas siswa di API diambil dari sesi login, bukan dari siswaId di body/query.
- Jangan kirim kunci jawaban kuis, miskonsepsi, nama kelompok, atau daftar siswa sekelas ke browser siswa.
- Jangan menambah paket di luar architecture.md bagian 2 tanpa bertanya.
- API route tanpa segmen dinamis; gunakan query string.
- Warna hanya dari token design.md; tidak ada hex di className.
- Semua teks UI berbahasa Indonesia.
- Fungsi logika di lib/ wajib punya tes vitest.
- Selesai = lint, build, test lulus, dengan bukti output.
- IMPORTANT: Jangan menjalankan git add, git commit, atau git push. Commit dilakukan manual oleh pengguna.