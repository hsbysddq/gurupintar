-- Migrasi Tipe Soal TKA-Friendly, Gambar Soal, dan Penilaian Esai Manual.
-- Jalankan file ini sekali di SQL Editor Supabase.

-- 1. Tabel soal: tambah kolom tipe dan gambar, serta longgarkan constraint kunci
--    agar mendukung pilgan kompleks ('A,C'), benar/salah ('B,S,B'), isian singkat (JSON array),
--    menjodohkan ('1:B,2:A'), dan pedoman jawaban esai (boleh kosong).
alter table soal add column if not exists tipe text not null default 'pilgan';
alter table soal add column if not exists gambar text;

alter table soal drop constraint if exists soal_tipe_check;
alter table soal
  add constraint soal_tipe_check
  check (tipe in ('pilgan','pilgan_kompleks','benar_salah','isian_singkat','menjodohkan','esai'));

alter table soal drop constraint if exists soal_kunci_check;
alter table soal
  add constraint soal_kunci_check
  check (char_length(kunci) <= 2000);

-- 2. Tabel jawaban: longgarkan constraint pilihan untuk menyimpan jawaban TKA & esai,
--    dan tambah penanda belum_dinilai untuk soal esai yang menunggu dinilai guru.
alter table jawaban add column if not exists belum_dinilai boolean not null default false;

alter table jawaban drop constraint if exists jawaban_pilihan_check;
alter table jawaban
  add constraint jawaban_pilihan_check
  check (char_length(pilihan) between 1 and 2000);

-- 3. Perbarui fungsi simpan_hasil agar ikut menyimpan status belum_dinilai.
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

-- 4. Perbarui fungsi ubah_topik agar menyimpan tipe dan gambar soal.
create or replace function ubah_topik(p_topik uuid, p_nama text, p_capaian text, p_soal jsonb)
returns void language plpgsql as $$
begin
  update topik set nama = p_nama, capaian_pembelajaran = p_capaian where id = p_topik;
  if not found then raise exception 'TOPIK_TIDAK_ADA'; end if;

  delete from soal where topik_id = p_topik;

  insert into soal (topik_id, nomor, tipe, teks, gambar, pilihan, kunci, miskonsepsi)
  select p_topik,
         (s->>'nomor')::int,
         coalesce(nullif(s->>'tipe', ''), 'pilgan'),
         s->>'teks',
         nullif(s->>'gambar', ''),
         s->'pilihan',
         coalesce(s->>'kunci', ''),
         coalesce(s->'miskonsepsi', '{}'::jsonb)
  from jsonb_array_elements(p_soal) as s;
end $$;

-- 5. Fungsi atomik untuk guru menilai jawaban esai dan memperbarui skor serta kelompok siswa.
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

revoke execute on function simpan_hasil(uuid, uuid, jsonb, int, int, text) from public, anon, authenticated;
revoke execute on function ubah_topik(uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function simpan_nilai_esai(uuid, uuid, uuid, boolean, int, int, text) from public, anon, authenticated;
grant execute on function simpan_hasil(uuid, uuid, jsonb, int, int, text) to service_role;
grant execute on function ubah_topik(uuid, text, text, jsonb) to service_role;
grant execute on function simpan_nilai_esai(uuid, uuid, uuid, boolean, int, int, text) to service_role;

