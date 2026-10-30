create extension if not exists pgcrypto with schema extensions;

drop table if exists materi, percobaan_kuis, hasil_siswa, jawaban, sesi_kuis, soal, topik, keanggotaan_kelas, siswa, kelas, pengguna cascade;

-- ===== Akun dan peran =====
-- Satu baris per pengguna Supabase Auth. `peran` menentukan area aplikasi yang boleh diakses.
create table pengguna (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text,
  peran text not null check (peran in ('guru','siswa')),
  dibuat_pada timestamptz not null default now()
);

-- ===== Kelas milik guru =====
create table kelas (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null references pengguna(id) on delete cascade,
  nama text not null,
  mapel text not null,
  kode_undangan text not null unique check (kode_undangan ~ '^[A-Z0-9]{5,6}$'),
  diarsipkan_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);
create index kelas_guru on kelas (guru_id);

-- ===== Keanggotaan siswa di kelas (banyak-ke-banyak) =====
create table keanggotaan_kelas (
  kelas_id uuid not null references kelas(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  nama_tampil text,
  preferensi_format text check (preferensi_format in ('ppt','audio','bacaan','latihan')),
  gabung_pada timestamptz not null default now(),
  primary key (kelas_id, siswa_id)
);
create index keanggotaan_siswa on keanggotaan_kelas (siswa_id);
-- Satu nama hanya boleh dipakai satu akun di kelas yang sama (tidak peka huruf besar-kecil).
create unique index keanggotaan_kelas_nama_unik on keanggotaan_kelas (kelas_id, lower(nama_tampil));

create table topik (
  id uuid primary key default gen_random_uuid(),
  dibuat_oleh uuid references pengguna(id) on delete set null,
  nama text not null,
  capaian_pembelajaran text not null
);

create table soal (
  id uuid primary key default gen_random_uuid(),
  topik_id uuid not null references topik(id) on delete cascade,
  nomor int not null,
  teks text not null,
  pilihan jsonb not null,          -- [{"kode":"A","teks":"3/4"}, ...]
  kunci text not null check (kunci in ('A','B','C','D')),
  miskonsepsi jsonb not null default '{}'::jsonb,  -- {"A":"...", "C":"..."}
  unique (topik_id, nomor)
);

create table sesi_kuis (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references kelas(id) on delete cascade,
  topik_id uuid not null references topik(id),
  kode_kelas text not null unique check (kode_kelas ~ '^[A-Z0-9]{5,6}$'),
  status text not null default 'aktif' check (status in ('aktif','selesai')),
  materi_diproses_sejak timestamptz,   -- kunci pembuatan materi (bagian 7.4)
  dibuat_pada timestamptz not null default now()
);
create index sesi_kuis_kelas_waktu on sesi_kuis (kelas_id, dibuat_pada desc);

create table jawaban (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  soal_id uuid not null references soal(id) on delete cascade,
  pilihan text not null check (pilihan in ('A','B','C','D')),
  benar boolean not null,
  dibuat_pada timestamptz not null default now(),
  unique (sesi_id, siswa_id, soal_id)
);

create table hasil_siswa (
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  skor int not null check (skor >= 0),
  total int not null check (total > 0),
  kelompok text not null check (kelompok in ('sudah','setengah','belum')),
  dikirim_pada timestamptz not null default now(),
  primary key (sesi_id, siswa_id),
  check (skor <= total)
);

-- Riwayat tiap pengiriman kuis (siswa boleh mengerjakan ulang). hasil_siswa = percobaan terakhir.
create table percobaan_kuis (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  skor int not null check (skor >= 0),
  total int not null check (total > 0),
  kelompok text not null check (kelompok in ('sudah','setengah','belum')),
  dikirim_pada timestamptz not null default now(),
  check (skor <= total)
);
create index percobaan_kuis_siswa_waktu on percobaan_kuis (siswa_id, sesi_id, dikirim_pada desc);

create table materi (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  kelompok text not null check (kelompok in ('sudah','setengah','belum')),
  isi jsonb not null,
  status text not null default 'draf' check (status in ('draf','dibagikan')),
  sumber text not null check (sumber in ('ai','cadangan')),
  versi int not null default 1,        -- optimistic locking (bagian 7.5)
  dibuat_pada timestamptz not null default now(),
  unique (sesi_id, kelompok)
);

-- Pustaka materi mandiri per kelas (hasil Ubah Modul).
create table materi_pustaka (
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
create index materi_pustaka_kelas_waktu on materi_pustaka (kelas_id, diperbarui_pada desc);

-- Keputusan guru dan status pendampingan per siswa/kelas.
create table tindakan_pendampingan (
  kelas_id uuid not null references kelas(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  sesi_terakhir_id uuid not null references sesi_kuis(id) on delete cascade,
  kategori text not null check (kategori in ('setengah','belum','tidak-mengerjakan')),
  tindakan text not null check (tindakan in ('pendampingan','evaluasi','selesai')),
  diperbarui_pada timestamptz not null default now(),
  primary key (kelas_id, siswa_id)
);
create index tindakan_pendampingan_waktu on tindakan_pendampingan (kelas_id, diperbarui_pada desc);

alter table pengguna enable row level security;
alter table kelas enable row level security;
alter table keanggotaan_kelas enable row level security;
alter table topik enable row level security;
alter table soal enable row level security;
alter table sesi_kuis enable row level security;
alter table jawaban enable row level security;
alter table hasil_siswa enable row level security;
alter table percobaan_kuis enable row level security;
alter table materi enable row level security;
alter table materi_pustaka enable row level security;
alter table tindakan_pendampingan enable row level security;
-- Sengaja TANPA policy: hanya service role (server) yang bisa mengakses (AD-3).
-- Otorisasi per pengguna dilakukan di API route setelah sesi Supabase diverifikasi.

-- ===== Fungsi atomik (AD-5) =====

create or replace function simpan_hasil(
  p_sesi uuid, p_siswa uuid, p_jawaban jsonb,
  p_skor int, p_total int, p_kelompok text
) returns void language plpgsql as $$
declare v_status text;
begin
  select status into v_status from sesi_kuis where id = p_sesi for share;
  if v_status is null then raise exception 'SESI_TIDAK_ADA'; end if;
  if v_status <> 'aktif' then raise exception 'SESI_DITUTUP'; end if;

  insert into jawaban (sesi_id, siswa_id, soal_id, pilihan, benar)
  select p_sesi, p_siswa, (j->>'soalId')::uuid, j->>'pilihan', (j->>'benar')::boolean
  from jsonb_array_elements(p_jawaban) as j
  on conflict (sesi_id, siswa_id, soal_id)
  do update set pilihan = excluded.pilihan, benar = excluded.benar, dibuat_pada = now();

  insert into hasil_siswa (sesi_id, siswa_id, skor, total, kelompok)
  values (p_sesi, p_siswa, p_skor, p_total, p_kelompok)
  on conflict (sesi_id, siswa_id)
  do update set skor = excluded.skor, total = excluded.total,
                kelompok = excluded.kelompok, dikirim_pada = now();

  insert into percobaan_kuis (sesi_id, siswa_id, skor, total, kelompok)
  values (p_sesi, p_siswa, p_skor, p_total, p_kelompok);
end $$;

create or replace function buka_sesi(p_kelas uuid, p_topik uuid, p_kode text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  update sesi_kuis set status = 'selesai' where kelas_id = p_kelas and status = 'aktif';
  insert into sesi_kuis (kelas_id, topik_id, kode_kelas) values (p_kelas, p_topik, p_kode)
  returning id into v_id;
  return v_id;
end $$;

create or replace function ambil_kunci_materi(p_sesi uuid)
returns boolean language plpgsql as $$
begin
  update sesi_kuis set materi_diproses_sejak = now()
  where id = p_sesi
    and (materi_diproses_sejak is null or materi_diproses_sejak < now() - interval '2 minutes');
  return found;
end $$;

create or replace function lepas_kunci_materi(p_sesi uuid)
returns void language sql as $$
  update sesi_kuis set materi_diproses_sejak = null where id = p_sesi;
$$;

-- Keluarkan siswa dari kelas sekaligus hapus jawaban/hasilnya di kelas tersebut.
create or replace function hapus_anggota_kelas(p_kelas uuid, p_siswa uuid)
returns void language plpgsql as $$
begin
  delete from jawaban j using sesi_kuis s
    where j.sesi_id = s.id and s.kelas_id = p_kelas and j.siswa_id = p_siswa;
  delete from percobaan_kuis p using sesi_kuis s
    where p.sesi_id = s.id and s.kelas_id = p_kelas and p.siswa_id = p_siswa;
  delete from hasil_siswa h using sesi_kuis s
    where h.sesi_id = s.id and s.kelas_id = p_kelas and h.siswa_id = p_siswa;
  delete from keanggotaan_kelas where kelas_id = p_kelas and siswa_id = p_siswa;
end $$;

-- Ubah topik + ganti 5 soalnya dalam satu transaksi.
create or replace function ubah_topik(p_topik uuid, p_nama text, p_capaian text, p_soal jsonb)
returns void language plpgsql as $$
begin
  update topik set nama = p_nama, capaian_pembelajaran = p_capaian where id = p_topik;
  if not found then raise exception 'TOPIK_TIDAK_ADA'; end if;

  delete from soal where topik_id = p_topik;

  insert into soal (topik_id, nomor, teks, pilihan, kunci, miskonsepsi)
  select p_topik, (s->>'nomor')::int, s->>'teks', s->'pilihan', s->>'kunci',
         coalesce(s->'miskonsepsi', '{}'::jsonb)
  from jsonb_array_elements(p_soal) as s;
end $$;

revoke execute on function simpan_hasil(uuid, uuid, jsonb, int, int, text) from public, anon, authenticated;
revoke execute on function buka_sesi(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function ambil_kunci_materi(uuid) from public, anon, authenticated;
revoke execute on function lepas_kunci_materi(uuid) from public, anon, authenticated;
revoke execute on function hapus_anggota_kelas(uuid, uuid) from public, anon, authenticated;
revoke execute on function ubah_topik(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function simpan_hasil(uuid, uuid, jsonb, int, int, text) to service_role;
grant execute on function buka_sesi(uuid, uuid, text) to service_role;
grant execute on function ambil_kunci_materi(uuid) to service_role;
grant execute on function lepas_kunci_materi(uuid) to service_role;
grant execute on function hapus_anggota_kelas(uuid, uuid) to service_role;
grant execute on function ubah_topik(uuid, text, text, jsonb) to service_role;
