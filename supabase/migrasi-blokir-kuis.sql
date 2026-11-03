-- Pemblokiran kuis karena siswa meninggalkan halaman kuis. Jalankan sekali di Supabase SQL Editor.
-- Satu baris per siswa per kuis. Selama terblokir = true, siswa tidak bisa memuat soal atau mengirim jawaban
-- sampai guru membuka blokirnya.
create table if not exists blokir_kuis (
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  jumlah int not null default 0 check (jumlah >= 0),
  terblokir boolean not null default false,
  jumlah_blokir int not null default 0 check (jumlah_blokir >= 0),
  diblokir_pada timestamptz,
  dibuka_pada timestamptz,
  diperbarui_pada timestamptz not null default now(),
  primary key (sesi_id, siswa_id)
);
create index if not exists blokir_kuis_sesi_terblokir on blokir_kuis (sesi_id) where terblokir;
alter table blokir_kuis enable row level security;
