-- Data demo Guru Pintar (PRD.md bagian 8). Boleh dijalankan ulang untuk mereset demo.
--
-- Akun demo:
--   Guru  : guru@demo.gurupintar.id / GuruPintar123!
--   Siswa : siswa1@demo.gurupintar.id ... siswa40@demo.gurupintar.id / SiswaPintar123!
--   Kode undangan kelas: KEL7A
--
-- Catatan keamanan: email akun demo langsung dikonfirmasi agar demo bisa dipakai tanpa SMTP.
-- Di produksi, aktifkan konfirmasi email di Supabase Auth dan jangan pakai kata sandi demo.

truncate materi, hasil_siswa, jawaban, sesi_kuis, soal, topik, keanggotaan_kelas, kelas, pengguna restart identity cascade;

-- Hapus akun demo lama agar seed bisa dijalankan ulang. FK pengguna ON DELETE CASCADE ikut membersihkan profil.
delete from auth.users where email like '%@demo.gurupintar.id';

-- ===== Akun auth (guru + 40 siswa) =====

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'guru@demo.gurupintar.id',
  extensions.crypt('GuruPintar123!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"],"peran":"guru"}'::jsonb,
  '{"nama":"Bu Rina"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  ('00000000-0000-4000-8000-' || lpad((1000 + n)::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'siswa' || n || '@demo.gurupintar.id',
  extensions.crypt('SiswaPintar123!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"],"peran":"siswa"}'::jsonb,
  jsonb_build_object('nama', nama),
  now(), now(), '', '', '', ''
from unnest(array[
  'Andi Saputra', 'Budi Santoso', 'Citra Lestari', 'Dimas Saputra',
  'Eka Putri', 'Fajar Nugroho', 'Gita Permata', 'Hendra Wijaya',
  'Intan Maharani', 'Joko Prasetyo', 'Kartika Sari', 'Lukman Hakim',
  'Maya Anggraini', 'Nanda Pratiwi', 'Oki Ramadhan', 'Putri Ayu',
  'Rizky Pratama', 'Salsa Nabila', 'Sari Wulandari', 'Taufik Hidayat',
  'Umi Kalsum', 'Vina Oktaviani', 'Wahyu Setiawan', 'Yoga Aditya',
  'Zahra Aulia', 'Bayu Firmansyah', 'Dewi Kurnia', 'Farhan Maulana',
  'Laras Ningrum', 'Nadia Safitri', 'Reza Kurniawan', 'Tiara Anjani',
  'Hana Pertiwi', 'Jihan Amalia', 'Kevin Prasetyo', 'Mira Handayani',
  'Gilang Ramadhan', 'Ilham Kurniawan', 'Lestari Wulan', 'Naufal Rizki'
]) with ordinality as t(nama, n);

-- Identitas provider email wajib ada agar signInWithPassword berhasil.
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  u.id,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email like '%@demo.gurupintar.id';

-- ===== Profil aplikasi =====

insert into pengguna (id, nama, email, peran)
select
  u.id,
  u.raw_user_meta_data->>'nama',
  u.email,
  u.raw_app_meta_data->>'peran'
from auth.users u
where u.email like '%@demo.gurupintar.id';

insert into kelas (id, guru_id, nama, mapel, kode_undangan) values
('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001',
 'Kelas 7A', 'Matematika', 'KEL7A');

insert into keanggotaan_kelas (kelas_id, siswa_id, nama_tampil)
select '00000000-0000-4000-8000-0000000000c1', id, nama
from pengguna
where peran = 'siswa';

-- ===== Topik (PRD 8.1) =====

insert into topik (id, dibuat_oleh, nama, capaian_pembelajaran) values
('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
 'Pecahan Senilai',
 'Peserta didik dapat menentukan dan membandingkan pecahan senilai.');

-- ===== Soal (PRD 8.3) =====

insert into soal (topik_id, nomor, teks, pilihan, kunci, miskonsepsi) values
('00000000-0000-4000-8000-000000000002', 1,
 'Pecahan yang senilai dengan 2/3 adalah …',
 '[{"kode":"A","teks":"3/4"},{"kode":"B","teks":"4/6"},{"kode":"C","teks":"4/5"},{"kode":"D","teks":"2/6"}]',
 'B',
 '{"A":"Menambah 1 pada pembilang dan penyebut.","C":"Menambah 2 pada pembilang dan penyebut.","D":"Hanya mengalikan penyebut."}'),
('00000000-0000-4000-8000-000000000002', 2,
 '3/4 = …/12. Bilangan yang tepat untuk mengisi titik-titik adalah …',
 '[{"kode":"A","teks":"3"},{"kode":"B","teks":"11"},{"kode":"C","teks":"9"},{"kode":"D","teks":"4"}]',
 'C',
 '{"A":"Tidak mengubah pembilang.","B":"Menambahkan selisih penyebut (8) ke pembilang.","D":"Memakai hasil bagi 12 : 3 sebagai pembilang."}'),
('00000000-0000-4000-8000-000000000002', 3,
 'Bentuk paling sederhana dari 12/18 adalah …',
 '[{"kode":"A","teks":"2/3"},{"kode":"B","teks":"6/9"},{"kode":"C","teks":"4/6"},{"kode":"D","teks":"2/8"}]',
 'A',
 '{"B":"Baru dibagi 2, belum paling sederhana.","C":"Baru dibagi 3, belum paling sederhana.","D":"Mengurangkan 10 dari pembilang dan penyebut."}'),
('00000000-0000-4000-8000-000000000002', 4,
 'Pecahan berikut yang TIDAK senilai dengan 1/2 adalah …',
 '[{"kode":"A","teks":"3/6"},{"kode":"B","teks":"5/10"},{"kode":"C","teks":"2/3"},{"kode":"D","teks":"4/8"}]',
 'C',
 '{"A":"Belum mengenali bahwa pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan bilangan yang sama.","B":"Belum mengenali bahwa pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan bilangan yang sama.","D":"Belum mengenali bahwa pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan bilangan yang sama."}'),
('00000000-0000-4000-8000-000000000002', 5,
 'Rina makan 2/8 pizza, Budi makan 1/4 pizza yang sama besar. Siapa yang makan lebih banyak?',
 '[{"kode":"A","teks":"Rina"},{"kode":"B","teks":"Budi"},{"kode":"C","teks":"Tidak bisa dibandingkan"},{"kode":"D","teks":"Sama banyak"}]',
 'D',
 '{"A":"Menganggap angka lebih besar berarti nilai lebih besar.","B":"Menganggap penyebut kecil selalu berarti lebih besar.","C":"Menganggap pecahan berpenyebut berbeda tidak bisa dibandingkan."}');

-- ===== Sesi kuis (PRD 8.4) =====

insert into sesi_kuis (id, kelas_id, topik_id, kode_kelas, status, dibuat_pada) values
('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000c1',
 '00000000-0000-4000-8000-000000000002', 'RIW001', 'selesai', '2026-09-07 08:00+07'),
('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-0000000000c1',
 '00000000-0000-4000-8000-000000000002', 'RIW002', 'selesai', '2026-09-14 08:00+07'),
('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-0000000000c1',
 '00000000-0000-4000-8000-000000000002', 'RIW003', 'selesai', '2026-09-21 08:00+07'),
('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-0000000000c1',
 '00000000-0000-4000-8000-000000000002', 'RIW004', 'selesai', '2026-09-26 08:00+07'),
('00000000-0000-4000-8000-000000000100', '00000000-0000-4000-8000-0000000000c1',
 '00000000-0000-4000-8000-000000000002', 'A7K2P', 'aktif', now());

-- ===== Riwayat hasil RIW001–RIW003 (PRD 8.5), 94 baris =====
-- Budi 1,2,1 · Sari 3,-,- · Rizky 5,4,3 · Dimas 1,2,4 · 28 siswa lain 5,4,5 · 8 siswa baru tanpa riwayat.
-- Kelompok mengikuti PRD A-2: 5/5 sudah; >= 60% (skor >= 3) setengah; < 60% belum.

insert into hasil_siswa (sesi_id, siswa_id, skor, total, kelompok, dikirim_pada)
select s.sesi_id, sw.id, v.skor, 5,
       case when v.skor = 5 then 'sudah' when v.skor >= 3 then 'setengah' else 'belum' end,
       s.waktu
from pengguna sw
join keanggotaan_kelas kk
  on kk.siswa_id = sw.id and kk.kelas_id = '00000000-0000-4000-8000-0000000000c1'
cross join (values
  (1, '00000000-0000-4000-8000-000000000101'::uuid, '2026-09-07 08:30+07'::timestamptz),
  (2, '00000000-0000-4000-8000-000000000102'::uuid, '2026-09-14 08:30+07'::timestamptz),
  (3, '00000000-0000-4000-8000-000000000103'::uuid, '2026-09-21 08:30+07'::timestamptz)
) as s(urut, sesi_id, waktu)
cross join lateral (select case sw.nama
  when 'Budi Santoso'   then (array[1,2,1])[s.urut]
  when 'Sari Wulandari' then (array[3,null,null])[s.urut]
  when 'Rizky Pratama'  then (array[5,4,3])[s.urut]
  when 'Dimas Saputra'  then (array[1,2,4])[s.urut]
  else (array[5,4,5])[s.urut] end as skor) as v
where sw.peran = 'siswa' and v.skor is not null
  and sw.nama <> all (array[
    'Hana Pertiwi', 'Jihan Amalia', 'Kevin Prasetyo', 'Mira Handayani',
    'Gilang Ramadhan', 'Ilham Kurniawan', 'Lestari Wulan', 'Naufal Rizki'
  ]);

-- ===== Hasil RIW004 (PRD 8.5), 38 baris =====
-- Sari Wulandari dan Dimas Saputra sengaja tidak menjawab.

insert into hasil_siswa (sesi_id, siswa_id, skor, total, kelompok, dikirim_pada)
select '00000000-0000-4000-8000-000000000104', sw.id, g.skor, 5,
       case when g.skor = 5 then 'sudah' when g.skor >= 3 then 'setengah' else 'belum' end,
       '2026-09-26 08:30+07'
from (values
  (5, array['Andi Saputra', 'Citra Lestari', 'Gita Permata', 'Intan Maharani', 'Kartika Sari',
            'Maya Anggraini', 'Salsa Nabila', 'Zahra Aulia', 'Hana Pertiwi', 'Jihan Amalia']),
  (4, array['Eka Putri', 'Fajar Nugroho', 'Lukman Hakim', 'Putri Ayu', 'Vina Oktaviani', 'Laras Ningrum']),
  (3, array['Hendra Wijaya', 'Nanda Pratiwi', 'Taufik Hidayat', 'Dewi Kurnia', 'Nadia Safitri', 'Kevin Prasetyo']),
  (2, array['Rizky Pratama', 'Joko Prasetyo', 'Oki Ramadhan', 'Umi Kalsum', 'Reza Kurniawan', 'Mira Handayani']),
  (1, array['Budi Santoso', 'Wahyu Setiawan', 'Yoga Aditya', 'Bayu Firmansyah', 'Farhan Maulana', 'Gilang Ramadhan']),
  (0, array['Tiara Anjani', 'Ilham Kurniawan', 'Lestari Wulan', 'Naufal Rizki'])
) as g(skor, daftar)
cross join unnest(g.daftar) as n(nama)
join pengguna sw on sw.nama = n.nama and sw.peran = 'siswa';

-- ===== Jawaban RIW004 (PRD 8.5), 190 baris =====
-- Benar = s soal pertama dari urutan [1, 2, 4, 3, 5] (s = skor).
-- Salah memakai pilihan tetap: soal 1 A, 2 A, 3 B, 4 A, 5 A.

insert into jawaban (sesi_id, siswa_id, soal_id, pilihan, benar, dibuat_pada)
select h.sesi_id, h.siswa_id, so.id,
       case when b.benar then so.kunci else (array['A','A','B','A','A'])[so.nomor] end,
       b.benar, h.dikirim_pada
from hasil_siswa h
join soal so on so.topik_id = '00000000-0000-4000-8000-000000000002'
cross join lateral (select array_position(array[1,2,4,3,5], so.nomor) <= h.skor as benar) as b
where h.sesi_id = '00000000-0000-4000-8000-000000000104';

-- Tabel materi sengaja tidak diisi.
