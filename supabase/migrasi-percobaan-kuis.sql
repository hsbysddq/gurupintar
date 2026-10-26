-- Migrasi: riwayat percobaan kuis.
-- Jalankan sekali di SQL Editor Supabase pada database yang sudah ada.
-- Siswa boleh mengerjakan ulang kuis yang masih aktif. Tiap pengiriman dicatat sebagai satu baris baru,
-- jadi hasil pertama tidak hilang dan semua percobaan muncul di histori. hasil_siswa tetap berisi percobaan
-- terakhir (dipakai guru untuk pengelompokan dan materi), jadi sisi guru tidak berubah.

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
create index if not exists percobaan_kuis_siswa_waktu on percobaan_kuis (siswa_id, sesi_id, dikirim_pada desc);
alter table percobaan_kuis enable row level security;

-- Hasil yang sudah ada dijadikan percobaan pertama (hanya sekali, bila tabel masih kosong).
insert into percobaan_kuis (sesi_id, siswa_id, skor, total, kelompok, dikirim_pada)
select h.sesi_id, h.siswa_id, h.skor, h.total, h.kelompok, h.dikirim_pada
from hasil_siswa h
where not exists (select 1 from percobaan_kuis);

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
