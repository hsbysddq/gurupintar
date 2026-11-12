-- Mode ujian formal. Kuis formatif (sesi_kuis) tetap terpisah.

create table if not exists ujian (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  guru_id uuid not null references pengguna(id) on delete cascade,
  judul text not null,
  deskripsi text,
  token text not null check (token ~ '^[A-Z0-9]{6,10}$'),
  mulai_pada timestamptz not null,
  selesai_pada timestamptz not null,
  durasi_menit int not null check (durasi_menit between 5 and 300),
  acak_soal boolean not null default false,
  acak_pilihan boolean not null default false,
  status text not null default 'draf' check (status in ('draf', 'terjadwal', 'aktif', 'selesai')),
  dirilis_pada timestamptz,
  dibuat_pada timestamptz not null default now(),
  check (selesai_pada > mulai_pada),
  unique (sekolah_id, token)
);
create index if not exists ujian_kelas_waktu on ujian (kelas_id, dibuat_pada desc);
create index if not exists ujian_sekolah_waktu on ujian (sekolah_id, dibuat_pada desc);

create table if not exists ujian_soal (
  id uuid primary key default gen_random_uuid(),
  ujian_id uuid not null references ujian(id) on delete cascade,
  soal_id uuid references soal(id) on delete set null,
  nomor int not null,
  tipe text not null check (tipe in ('pilgan', 'pilgan_kompleks', 'esai')),
  teks text not null,
  gambar text,
  pilihan jsonb not null default '[]'::jsonb,
  kunci text not null default '',
  miskonsepsi jsonb not null default '{}'::jsonb,
  bobot int not null default 1 check (bobot between 1 and 100),
  unique (ujian_id, nomor)
);
create index if not exists ujian_soal_ujian on ujian_soal (ujian_id, nomor);

create table if not exists ujian_peserta (
  ujian_id uuid not null references ujian(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  status text not null default 'belum' check (status in ('belum', 'mengerjakan', 'selesai', 'diblokir')),
  token_diverifikasi_pada timestamptz,
  mulai_pada timestamptz,
  batas_pada timestamptz,
  dikumpulkan_pada timestamptz,
  percobaan_token int not null default 0 check (percobaan_token >= 0),
  jumlah_pelanggaran int not null default 0 check (jumlah_pelanggaran >= 0),
  skor_bobot numeric(10,2) not null default 0,
  total_bobot numeric(10,2) not null default 0,
  persen numeric(5,2),
  primary key (ujian_id, siswa_id)
);
create index if not exists ujian_peserta_sekolah on ujian_peserta (sekolah_id, ujian_id);

create table if not exists ujian_jawaban (
  ujian_id uuid not null references ujian(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  soal_id uuid not null references ujian_soal(id) on delete cascade,
  jawaban text not null default '',
  benar boolean,
  bobot_didapat numeric(10,2) not null default 0,
  dinilai_pada timestamptz,
  dinilai_oleh uuid references pengguna(id) on delete set null,
  primary key (ujian_id, siswa_id, soal_id)
);

create table if not exists ujian_pelanggaran (
  id uuid primary key default gen_random_uuid(),
  ujian_id uuid not null references ujian(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  jenis text not null check (jenis in ('pindah_tab', 'keluar_fullscreen', 'copy', 'paste', 'menu_klik_kanan', 'lain')),
  detail jsonb not null default '{}'::jsonb,
  terjadi_pada timestamptz not null default now()
);
create index if not exists ujian_pelanggaran_peserta on ujian_pelanggaran (ujian_id, siswa_id, terjadi_pada desc);

create table if not exists ujian_tindakan (
  id uuid primary key default gen_random_uuid(),
  ujian_id uuid not null references ujian(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  admin_id uuid not null references pengguna(id) on delete restrict,
  jenis text not null check (jenis in ('buka_blokir', 'tambah_waktu', 'rilis_hasil')),
  catatan text,
  dibuat_pada timestamptz not null default now()
);

alter table ujian enable row level security;
alter table ujian_soal enable row level security;
alter table ujian_peserta enable row level security;
alter table ujian_jawaban enable row level security;
alter table ujian_pelanggaran enable row level security;
alter table ujian_tindakan enable row level security;
