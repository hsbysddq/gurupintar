-- Fondasi multi-sekolah. Aman dijalankan pada database yang sudah berisi data.
-- Semua pengguna/kelas lama dimasukkan ke sekolah default.

create table if not exists sekolah (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text,
  kode text not null unique,
  dibuat_pada timestamptz not null default now()
);

alter table sekolah enable row level security;

insert into sekolah (id, nama, alamat, kode)
values (
  '00000000-0000-4000-8000-000000000001',
  'Sekolah Default',
  null,
  'SEKOLAH-DEFAULT'
)
on conflict (id) do nothing;

alter table pengguna add column if not exists sekolah_id uuid references sekolah(id) on delete restrict;
alter table pengguna drop constraint if exists pengguna_sekolah_check;
alter table pengguna drop constraint if exists pengguna_peran_check;

update pengguna
set sekolah_id = '00000000-0000-4000-8000-000000000001'
where sekolah_id is null;

alter table pengguna
  add constraint pengguna_peran_check
  check (peran in ('super_admin', 'admin_sekolah', 'guru', 'siswa'));

alter table pengguna
  add constraint pengguna_sekolah_check
  check (
    (peran = 'super_admin' and sekolah_id is null) or
    (peran <> 'super_admin' and sekolah_id is not null)
  );

create index if not exists pengguna_sekolah on pengguna (sekolah_id);

alter table kelas add column if not exists sekolah_id uuid references sekolah(id) on delete restrict;

update kelas k
set sekolah_id = p.sekolah_id
from pengguna p
where k.guru_id = p.id and k.sekolah_id is null;

update kelas
set sekolah_id = '00000000-0000-4000-8000-000000000001'
where sekolah_id is null;

alter table kelas alter column sekolah_id set not null;
alter table kelas alter column sekolah_id set default '00000000-0000-4000-8000-000000000001';
create index if not exists kelas_sekolah on kelas (sekolah_id);
