-- Migrasi identitas siswa:
-- 1. email akun disimpan di pengguna agar guru bisa memverifikasi identitas,
-- 2. nama tampil per kelas + indeks unik agar satu nama hanya dipakai satu akun per kelas,
-- 3. fungsi untuk mengeluarkan siswa dari kelas beserta jawaban/hasilnya di kelas itu.
--
-- Jalankan sekali di SQL Editor Supabase. Jika sudah ada nama ganda di satu kelas,
-- rapikan dulu sebelum indeks unik dibuat.

alter table pengguna add column if not exists email text;

update pengguna p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

alter table keanggotaan_kelas add column if not exists nama_tampil text;

update keanggotaan_kelas kk
set nama_tampil = p.nama
from pengguna p
where kk.siswa_id = p.id and kk.nama_tampil is null;

create unique index if not exists keanggotaan_kelas_nama_unik
  on keanggotaan_kelas (kelas_id, lower(nama_tampil));

create or replace function hapus_anggota_kelas(p_kelas uuid, p_siswa uuid)
returns void language plpgsql as $$
begin
  delete from jawaban j using sesi_kuis s
    where j.sesi_id = s.id and s.kelas_id = p_kelas and j.siswa_id = p_siswa;
  delete from hasil_siswa h using sesi_kuis s
    where h.sesi_id = s.id and s.kelas_id = p_kelas and h.siswa_id = p_siswa;
  delete from keanggotaan_kelas where kelas_id = p_kelas and siswa_id = p_siswa;
end $$;

revoke execute on function hapus_anggota_kelas(uuid, uuid) from public, anon, authenticated;
grant execute on function hapus_anggota_kelas(uuid, uuid) to service_role;
