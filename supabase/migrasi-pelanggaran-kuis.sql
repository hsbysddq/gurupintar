-- Migrasi: pelacakan pelanggaran saat kuis.
-- Jalankan sekali di SQL Editor Supabase pada database yang sudah ada.
-- Saat ini hanya mencatat pindah tab/jendela browser dari halaman kuis siswa.

create table if not exists pelanggaran_kuis (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  jenis text not null check (jenis in ('pindah-tab')),
  dibuat_pada timestamptz not null default now()
);
create index if not exists pelanggaran_kuis_sesi_siswa on pelanggaran_kuis (sesi_id, siswa_id);

alter table pelanggaran_kuis enable row level security;
-- Sengaja TANPA policy: hanya service role (server) yang mengakses tabel ini.
