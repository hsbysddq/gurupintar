-- Keputusan guru dan status pendampingan per siswa/kelas.
-- Jalankan file ini sekali di Supabase SQL Editor sebelum memakai tombol tindakan.

create table if not exists tindakan_pendampingan (
  kelas_id uuid not null references kelas(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  sesi_terakhir_id uuid not null references sesi_kuis(id) on delete cascade,
  kategori text not null check (kategori in ('setengah','belum','tidak-mengerjakan')),
  tindakan text not null check (tindakan in ('pendampingan','evaluasi','selesai')),
  diperbarui_pada timestamptz not null default now(),
  primary key (kelas_id, siswa_id)
);

create index if not exists tindakan_pendampingan_waktu
  on tindakan_pendampingan (kelas_id, diperbarui_pada desc);

alter table tindakan_pendampingan enable row level security;
-- Sengaja TANPA policy: hanya service role (server) yang mengakses tabel ini.
