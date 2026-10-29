-- Opsi format "Video" diganti "PPT". Jalankan sekali di Supabase SQL Editor.
alter table keanggotaan_kelas drop constraint if exists keanggotaan_kelas_preferensi_format_check;
update keanggotaan_kelas set preferensi_format = 'ppt' where preferensi_format = 'video';
alter table keanggotaan_kelas
  add constraint keanggotaan_kelas_preferensi_format_check
  check (preferensi_format in ('ppt','audio','bacaan','latihan'));
