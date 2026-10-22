-- Migrasi Tahap 4: arsip kelas.
-- Jalankan sekali di SQL Editor Supabase pada database yang sudah ada.
alter table kelas add column if not exists diarsipkan_pada timestamptz;
