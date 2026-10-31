-- Pilihan bentuk materi: Video, Audio, Bacaan, PPT. Jalankan sekali di Supabase SQL Editor.
-- Nilai lama (video, latihan) tetap diizinkan supaya data yang sudah ada tidak ditolak.
alter table keanggotaan_kelas drop constraint if exists keanggotaan_kelas_preferensi_format_check;
alter table keanggotaan_kelas
  add constraint keanggotaan_kelas_preferensi_format_check
  check (preferensi_format in ('video','audio','bacaan','latihan','ppt'));
