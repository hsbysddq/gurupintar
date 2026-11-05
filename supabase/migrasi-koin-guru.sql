-- Sistem koin untuk fitur AI guru. Jalankan sekali di SQL Editor Supabase.
-- Akun baru default 0 koin; akun demo guru mendapat 20 koin.
-- Setiap generate Ubah Modul memakai 1 koin; top up lewat fungsi tambah_koin.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pengguna' and column_name = 'koin'
  ) then
    alter table pengguna add column koin int not null default 0 check (koin >= 0);
  end if;
end $$;
alter table pengguna alter column koin set default 0;

-- Hanya akun demo ini yang mendapat 20 koin; akun lain tetap 0.
update pengguna
set koin = 20
where email = 'demo.guru@gurupintar.id' and peran = 'guru';

create table if not exists transaksi_koin (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null references pengguna(id) on delete cascade,
  jumlah int not null check (jumlah <> 0),
  jenis text not null check (jenis in ('bonus_awal','topup','generate_modul','refund','penyesuaian')),
  keterangan text,
  dibuat_pada timestamptz not null default now()
);
create index if not exists transaksi_koin_guru_waktu
  on transaksi_koin (guru_id, dibuat_pada desc);
alter table transaksi_koin enable row level security;

-- Potong koin secara atomik. Gagal jika saldo tidak cukup, sehingga dua request
-- yang berjalan bersamaan tidak bisa membuat saldo minus.
create or replace function potong_koin(
  p_guru uuid,
  p_jumlah int,
  p_keterangan text default null
) returns int language plpgsql as $$
declare v_koin int;
begin
  if p_jumlah <= 0 then raise exception 'JUMLAH_KOIN_TIDAK_VALID'; end if;

  update pengguna
  set koin = koin - p_jumlah
  where id = p_guru and peran = 'guru' and koin >= p_jumlah
  returning koin into v_koin;

  if not found then
    if exists (select 1 from pengguna where id = p_guru and peran = 'guru') then
      raise exception 'KOIN_TIDAK_CUKUP';
    end if;
    raise exception 'GURU_TIDAK_ADA';
  end if;

  insert into transaksi_koin (guru_id, jumlah, jenis, keterangan)
  values (p_guru, -p_jumlah, 'generate_modul', p_keterangan);

  return v_koin;
end $$;

-- Tambah koin untuk top up, refund, atau penyesuaian admin.
create or replace function tambah_koin(
  p_guru uuid,
  p_jumlah int,
  p_jenis text,
  p_keterangan text default null
) returns int language plpgsql as $$
declare v_koin int;
begin
  if p_jumlah <= 0 then raise exception 'JUMLAH_KOIN_TIDAK_VALID'; end if;
  if p_jenis not in ('bonus_awal','topup','refund','penyesuaian') then
    raise exception 'JENIS_KOIN_TIDAK_VALID';
  end if;

  update pengguna
  set koin = koin + p_jumlah
  where id = p_guru and peran = 'guru'
  returning koin into v_koin;

  if not found then raise exception 'GURU_TIDAK_ADA'; end if;

  insert into transaksi_koin (guru_id, jumlah, jenis, keterangan)
  values (p_guru, p_jumlah, p_jenis, p_keterangan);

  return v_koin;
end $$;

revoke execute on function potong_koin(uuid, int, text) from public, anon, authenticated;
revoke execute on function tambah_koin(uuid, int, text, text) from public, anon, authenticated;
grant execute on function potong_koin(uuid, int, text) to service_role;
grant execute on function tambah_koin(uuid, int, text, text) to service_role;

notify pgrst, 'reload schema';
