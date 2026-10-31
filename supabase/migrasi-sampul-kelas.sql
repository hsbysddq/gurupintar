-- Warna aksen dan foto sampul kartu kelas.
-- Jalankan file ini sekali di Supabase SQL Editor.

alter table kelas add column if not exists warna text;
alter table kelas add column if not exists sampul text;

-- warna: kode hex #RRGGBB; sampul: data URL gambar (disimpan sebagai teks untuk demo).
