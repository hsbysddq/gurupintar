-- Bucket audio Gemini untuk Ubah Modul.
-- Server memakai service role untuk upload; siswa hanya membaca lewat URL publik.
insert into storage.buckets (id, name, public)
values ('materi-audio', 'materi-audio', true)
on conflict (id) do update set public = true;

drop policy if exists "Audio materi bisa dibaca" on storage.objects;
create policy "Audio materi bisa dibaca"
on storage.objects for select
using (bucket_id = 'materi-audio');
