-- Migrasi: jadwal buka/tutup kuis otomatis.
-- Jalankan sekali di SQL Editor Supabase pada database yang sudah ada.
-- Tanpa baris jadwal, sesi dianggap sudah terbuka dan hanya bisa ditutup manual.
create table if not exists jadwal_kuis (
  sesi_id uuid primary key references sesi_kuis(id) on delete cascade,
  buka_pada timestamptz not null default now(),
  tutup_pada timestamptz,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  check (tutup_pada is null or tutup_pada > buka_pada)
);
create index if not exists jadwal_kuis_tutup on jadwal_kuis (tutup_pada) where tutup_pada is not null;
alter table jadwal_kuis enable row level security;

-- Sesi yang sudah lewat batas tutup langsung ditandai selesai.
update sesi_kuis s
set status = 'selesai'
from jadwal_kuis j
where j.sesi_id = s.id
  and s.status = 'aktif'
  and j.tutup_pada is not null
  and j.tutup_pada <= now();
