-- Keputusan guru dan status pendampingan per siswa untuk satu kuis selesai.
-- Jalankan file ini sekali di Supabase SQL Editor.

create table if not exists tindakan_pendampingan_kuis (
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  kategori text not null check (kategori in ('setengah','belum','tidak-mengerjakan')),
  tindakan text not null check (tindakan in ('pendampingan','evaluasi','selesai')),
  diperbarui_pada timestamptz not null default now(),
  primary key (sesi_id, siswa_id)
);

create index if not exists tindakan_pendampingan_kuis_waktu
  on tindakan_pendampingan_kuis (sesi_id, diperbarui_pada desc);

alter table tindakan_pendampingan_kuis enable row level security;
-- Sengaja TANPA policy: hanya service role (server) yang mengakses tabel ini.
