-- Perbaikan database untuk pengiriman jawaban kuis dan jadwal otomatis.
-- Jalankan file ini sekali di SQL Editor Supabase. Aman dijalankan berulang.
--
-- Mengapa perlu: fungsi simpan_hasil menulis ke percobaan_kuis, dan pengecekan jadwal
-- membaca jadwal_kuis. Jika salah satu tabel belum ada, kirim jawaban berakhir 500.

-- Pastikan kolom penilaian esai tersedia sebelum fungsi diperbarui.
alter table jawaban add column if not exists belum_dinilai boolean not null default false;

-- ===== Riwayat percobaan kuis =====
create table if not exists percobaan_kuis (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_kuis(id) on delete cascade,
  siswa_id uuid not null references pengguna(id) on delete cascade,
  skor int not null check (skor >= 0),
  total int not null check (total > 0),
  kelompok text not null check (kelompok in ('sudah','setengah','belum')),
  dikirim_pada timestamptz not null default now(),
  check (skor <= total)
);
create index if not exists percobaan_kuis_siswa_waktu
  on percobaan_kuis (siswa_id, sesi_id, dikirim_pada desc);
alter table percobaan_kuis enable row level security;

-- Hasil yang sudah ada tetap muncul di riwayat tanpa membuat duplikat.
insert into percobaan_kuis (sesi_id, siswa_id, skor, total, kelompok, dikirim_pada)
select h.sesi_id, h.siswa_id, h.skor, h.total, h.kelompok, h.dikirim_pada
from hasil_siswa h
where not exists (
  select 1 from percobaan_kuis p
  where p.sesi_id = h.sesi_id and p.siswa_id = h.siswa_id
);

-- ===== Jadwal buka/tutup otomatis =====
create table if not exists jadwal_kuis (
  sesi_id uuid primary key references sesi_kuis(id) on delete cascade,
  buka_pada timestamptz not null default now(),
  tutup_pada timestamptz,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  check (tutup_pada is null or tutup_pada > buka_pada)
);
create index if not exists jadwal_kuis_tutup
  on jadwal_kuis (tutup_pada) where tutup_pada is not null;
alter table jadwal_kuis enable row level security;

update sesi_kuis s
set status = 'selesai'
from jadwal_kuis j
where j.sesi_id = s.id
  and s.status = 'aktif'
  and j.tutup_pada is not null
  and j.tutup_pada <= now();

-- ===== Fungsi simpan jawaban (versi lengkap: TKA, esai, dan riwayat percobaan) =====
create or replace function simpan_hasil(
  p_sesi uuid, p_siswa uuid, p_jawaban jsonb,
  p_skor int, p_total int, p_kelompok text
) returns void language plpgsql as $$
declare v_status text;
begin
  select status into v_status from sesi_kuis where id = p_sesi for share;
  if v_status is null then raise exception 'SESI_TIDAK_ADA'; end if;
  if v_status <> 'aktif' then raise exception 'SESI_DITUTUP'; end if;

  insert into jawaban (sesi_id, siswa_id, soal_id, pilihan, benar, belum_dinilai)
  select p_sesi, p_siswa, (j->>'soalId')::uuid, j->>'pilihan',
         (j->>'benar')::boolean, coalesce((j->>'belumDinilai')::boolean, false)
  from jsonb_array_elements(p_jawaban) as j
  on conflict (sesi_id, siswa_id, soal_id)
  do update set pilihan = excluded.pilihan,
                benar = excluded.benar,
                belum_dinilai = excluded.belum_dinilai,
                dibuat_pada = now();

  insert into hasil_siswa (sesi_id, siswa_id, skor, total, kelompok)
  values (p_sesi, p_siswa, p_skor, p_total, p_kelompok)
  on conflict (sesi_id, siswa_id)
  do update set skor = excluded.skor, total = excluded.total,
                kelompok = excluded.kelompok, dikirim_pada = now();

  insert into percobaan_kuis (sesi_id, siswa_id, skor, total, kelompok)
  values (p_sesi, p_siswa, p_skor, p_total, p_kelompok);
end $$;

-- ===== Penilaian esai =====
create or replace function simpan_nilai_esai(
  p_sesi uuid, p_siswa uuid, p_soal uuid,
  p_benar boolean, p_skor int, p_total int, p_kelompok text
) returns void language plpgsql as $$
begin
  update jawaban
  set benar = p_benar, belum_dinilai = false
  where sesi_id = p_sesi and siswa_id = p_siswa and soal_id = p_soal;
  if not found then raise exception 'JAWABAN_TIDAK_ADA'; end if;

  update hasil_siswa
  set skor = p_skor, total = p_total, kelompok = p_kelompok
  where sesi_id = p_sesi and siswa_id = p_siswa;

  update percobaan_kuis
  set skor = p_skor, total = p_total, kelompok = p_kelompok
  where id = (
    select id from percobaan_kuis
    where sesi_id = p_sesi and siswa_id = p_siswa
    order by dikirim_pada desc
    limit 1
  );
end $$;

-- ===== Hapus anggota kelas beserta seluruh jejak kuisnya =====
create or replace function hapus_anggota_kelas(p_kelas uuid, p_siswa uuid)
returns void language plpgsql as $$
begin
  delete from jawaban j using sesi_kuis s
    where j.sesi_id = s.id and s.kelas_id = p_kelas and j.siswa_id = p_siswa;
  delete from blokir_kuis b using sesi_kuis s
    where b.sesi_id = s.id and s.kelas_id = p_kelas and b.siswa_id = p_siswa;
  delete from percobaan_kuis p using sesi_kuis s
    where p.sesi_id = s.id and s.kelas_id = p_kelas and p.siswa_id = p_siswa;
  delete from hasil_siswa h using sesi_kuis s
    where h.sesi_id = s.id and s.kelas_id = p_kelas and h.siswa_id = p_siswa;
  delete from keanggotaan_kelas where kelas_id = p_kelas and siswa_id = p_siswa;
end $$;

revoke execute on function simpan_hasil(uuid, uuid, jsonb, int, int, text) from public, anon, authenticated;
revoke execute on function simpan_nilai_esai(uuid, uuid, uuid, boolean, int, int, text) from public, anon, authenticated;
revoke execute on function hapus_anggota_kelas(uuid, uuid) from public, anon, authenticated;
grant execute on function simpan_hasil(uuid, uuid, jsonb, int, int, text) to service_role;
grant execute on function simpan_nilai_esai(uuid, uuid, uuid, boolean, int, int, text) to service_role;
grant execute on function hapus_anggota_kelas(uuid, uuid) to service_role;

-- Segarkan schema cache PostgREST agar tabel baru langsung dikenali API.
notify pgrst, 'reload schema';
