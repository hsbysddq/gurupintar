-- Pustaka materi mandiri per kelas (hasil Ubah Modul).
-- Jalankan file ini sekali di Supabase SQL Editor sebelum memakai tab Materi versi baru.

create table if not exists materi_pustaka (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null references pengguna(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  bab text not null,
  judul text not null,
  isi jsonb not null,
  sumber text not null check (sumber in ('ai','cadangan')),
  asal text not null check (asal in ('teks','pdf')),
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create index if not exists materi_pustaka_kelas_waktu
  on materi_pustaka (kelas_id, diperbarui_pada desc);

alter table materi_pustaka enable row level security;
-- Sengaja TANPA policy: hanya service role (server) yang mengakses tabel ini.
-- Otorisasi per guru dilakukan di API route setelah sesi Supabase diverifikasi.
