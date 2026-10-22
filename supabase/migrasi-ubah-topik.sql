-- Migrasi Bank Soal: izinkan guru mengubah topik dan 5 soalnya sekaligus.
-- Jalankan sekali di SQL Editor Supabase.
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

revoke execute on function ubah_topik(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function ubah_topik(uuid, text, text, jsonb) to service_role;
