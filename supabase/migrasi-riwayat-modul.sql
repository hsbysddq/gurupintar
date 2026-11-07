-- Riwayat pembuatan Ubah Modul per guru.
-- Jalankan sekali di Supabase SQL Editor. Tanpa tabel ini, generate tetap jalan,
-- tetapi daftar riwayat di halaman Ubah Modul belum bisa dimuat.
create table if not exists riwayat_modul (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null references pengguna(id) on delete cascade,
  judul text not null,
  format text not null check (format in ('video', 'audio', 'bacaan')),
  gaya_audio text,
  isi jsonb not null,
  sumber text not null default 'ai',
  dibuat_pada timestamptz not null default now()
);

create index if not exists riwayat_modul_guru_waktu
  on riwayat_modul (guru_id, dibuat_pada desc);

alter table riwayat_modul enable row level security;
-- Sengaja tanpa policy: hanya service role (server) yang mengakses tabel ini.
-- Otorisasi per guru dilakukan di API route setelah sesi diverifikasi.
