import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GURU = {
  email: 'demo.guru@gurupintar.id',
  password: 'DemoGuru123!',
  nama: 'Bu Sari',
};
const SISWA_DOMAIN = 'demo-guru.gurupintar.id';
const SISWA_PASSWORD = 'MuridPintar123!';
const NAMA_SISWA = [
  'Andi Saputra', 'Budi Santoso', 'Citra Lestari', 'Dimas Saputra',
  'Eka Putri', 'Fajar Nugroho', 'Gita Permata', 'Hendra Wijaya',
  'Intan Maharani', 'Joko Prasetyo', 'Kartika Sari', 'Lukman Hakim',
  'Maya Anggraini', 'Nanda Pratiwi', 'Oki Ramadhan', 'Putri Ayu',
  'Rizky Pratama', 'Salsa Nabila', 'Sari Wulandari', 'Taufik Hidayat',
  'Umi Kalsum', 'Vina Oktaviani', 'Wahyu Setiawan', 'Yoga Aditya',
  'Zahra Aulia', 'Bayu Firmansyah', 'Dewi Kurnia', 'Farhan Maulana',
  'Laras Ningrum', 'Nadia Safitri', 'Reza Kurniawan', 'Tiara Anjani',
  'Hana Pertiwi', 'Jihan Amalia', 'Kevin Prasetyo', 'Mira Handayani',
  'Gilang Ramadhan', 'Ilham Kurniawan', 'Lestari Wulan', 'Naufal Rizki',
];

const KELAS = [
  { id: '00000000-0000-4000-8000-00000000f201', nama: 'Kelas 7A', mapel: 'Matematika', kode: 'SRI7A' },
  { id: '00000000-0000-4000-8000-00000000f202', nama: 'Kelas 7B', mapel: 'Bahasa Indonesia', kode: 'SRI7B' },
  { id: '00000000-0000-4000-8000-00000000f203', nama: 'Kelas 7C', mapel: 'IPA', kode: 'SRI7C' },
];
const TOPIK = [
  {
    id: '00000000-0000-4000-8000-00000000f301',
    nama: 'Cek Pemahaman Matematika',
    capaian: 'Peserta didik dapat memahami materi Matematika kelas 7 yang sedang dipelajari.',
  },
  {
    id: '00000000-0000-4000-8000-00000000f302',
    nama: 'Cek Pemahaman Bahasa Indonesia',
    capaian: 'Peserta didik dapat memahami materi Bahasa Indonesia kelas 7 yang sedang dipelajari.',
  },
  {
    id: '00000000-0000-4000-8000-00000000f303',
    nama: 'Cek Pemahaman IPA',
    capaian: 'Peserta didik dapat memahami materi IPA kelas 7 yang sedang dipelajari.',
  },
];

const HARI = 86_400_000;
const sekarang = Date.now();
const TANGGAL_SELESAI = [sekarang - 28 * HARI, sekarang - 21 * HARI, sekarang - 14 * HARI, sekarang - 7 * HARI];
const KODE_SESI = ['SMA', 'SMB', 'SMC'];
// 7C (indeks 2) sengaja tidak punya jawaban agar grafik kelas kosong.
const KELAS_TANPA_JAWABAN = 2;

const POLA = [
  [1, 1, 2, 1], // rata-rata belum paham
  [2, 3, 4, 3], // rata-rata setengah paham
  [4, 3, 4, 3], // rata-rata setengah paham
  [5, 5, 2, 4], // rata-rata paham
  [5, 4, 5, 4], // rata-rata paham
];

function polaSiswa(indeks) {
  if (indeks < 4) return POLA[0];
  if (indeks < 8) return POLA[1];
  if (indeks < 12) return POLA[2];
  if (indeks < 16) return POLA[3];
  return POLA[4];
}

function idSesi(kelasKe, sesiKe) {
  return `00000000-0000-4000-8000-00000000f4${kelasKe + 1}${sesiKe + 1}`;
}

function kelompok(skor) {
  if (skor === 5) return 'sudah';
  if (skor >= 3) return 'setengah';
  return 'belum';
}

async function must(promise, label) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function insertBatches(table, rows, ukuran = 200) {
  for (let i = 0; i < rows.length; i += ukuran) {
    await must(supabase.from(table).insert(rows.slice(i, i + ukuran)), table);
  }
}

async function cleanup() {
  const kelasIds = KELAS.map((k) => k.id);
  const topikIds = TOPIK.map((t) => t.id);

  const guru = await supabase.from('pengguna').select('id').eq('email', GURU.email).maybeSingle();
  if (guru.data) {
    const milik = await supabase.from('kelas').select('id').eq('guru_id', guru.data.id);
    for (const k of milik.data ?? []) if (!kelasIds.includes(k.id)) kelasIds.push(k.id);
    const topik = await supabase.from('topik').select('id').eq('dibuat_oleh', guru.data.id);
    for (const t of topik.data ?? []) if (!topikIds.includes(t.id)) topikIds.push(t.id);
  }

  await supabase.from('sesi_kuis').delete().in('kelas_id', kelasIds);
  await supabase.from('sesi_kuis').delete().in('topik_id', topikIds);
  await supabase.from('topik').delete().in('id', topikIds);
  await supabase.from('kelas').delete().in('id', kelasIds);

  const profil = await supabase
    .from('pengguna')
    .select('id')
    .or(`email.eq.${GURU.email},email.like.murid%@${SISWA_DOMAIN}`);
  const profilIds = (profil.data ?? []).map((p) => p.id);
  if (profilIds.length > 0) await supabase.from('pengguna').delete().in('id', profilIds);

  const daftar = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (daftar.error) throw daftar.error;
  const target = (daftar.data.users ?? []).filter(
    (u) => u.email === GURU.email || u.email?.endsWith(`@${SISWA_DOMAIN}`),
  );
  for (const user of target) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }
}

async function buatAkun({ email, password, nama, peran }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { peran },
    user_metadata: { nama },
  });
  if (error) throw new Error(`Akun ${email}: ${error.message}`);
  return { id: data.user.id, email, nama };
}

async function main() {
  console.log('Membersihkan data demo lama...');
  await cleanup();

  console.log('Membuat akun guru dan 40 siswa...');
  const guru = await buatAkun({ ...GURU, peran: 'guru' });
  const siswa = [];
  for (let i = 0; i < NAMA_SISWA.length; i += 1) {
    const akun = await buatAkun({
      email: `murid${i + 1}@${SISWA_DOMAIN}`,
      password: SISWA_PASSWORD,
      nama: NAMA_SISWA[i],
      peran: 'siswa',
    });
    siswa.push(akun);
  }

  await must(
    supabase.from('pengguna').upsert(
      [
        { id: guru.id, nama: guru.nama, email: guru.email, peran: 'guru' },
        ...siswa.map((s) => ({ id: s.id, nama: s.nama, email: s.email, peran: 'siswa' })),
      ],
      { onConflict: 'id' },
    ),
    'profil pengguna',
  );

  await must(
    supabase.from('kelas').upsert(
      KELAS.map((k) => ({
        id: k.id,
        guru_id: guru.id,
        nama: k.nama,
        mapel: k.mapel,
        kode_undangan: k.kode,
      })),
      { onConflict: 'id' },
    ),
    'kelas',
  );

  await must(
    supabase.from('keanggotaan_kelas').upsert(
      KELAS.flatMap((k) =>
        siswa.map((s) => ({ kelas_id: k.id, siswa_id: s.id, nama_tampil: s.nama })),
      ),
      { onConflict: 'kelas_id,siswa_id' },
    ),
    'anggota kelas',
  );

  await must(
    supabase.from('topik').upsert(
      TOPIK.map((t) => ({
        id: t.id,
        dibuat_oleh: guru.id,
        nama: t.nama,
        capaian_pembelajaran: t.capaian,
      })),
      { onConflict: 'id' },
    ),
    'topik',
  );

  const soal = TOPIK.flatMap((t) =>
    Array.from({ length: 5 }, (_, i) => ({
      topik_id: t.id,
      nomor: i + 1,
      teks: `Soal ${i + 1} — ${t.nama}: pilih jawaban yang paling tepat.`,
      pilihan: [
        { kode: 'A', teks: 'Pilihan A' },
        { kode: 'B', teks: 'Pilihan B' },
        { kode: 'C', teks: 'Pilihan C' },
        { kode: 'D', teks: 'Pilihan D' },
      ],
      kunci: 'A',
      miskonsepsi: {
        B: 'Perlu mengulang konsep dasar.',
        C: 'Perlu latihan tambahan.',
        D: 'Perlu membaca kembali materi.',
      },
    })),
  );
  await must(supabase.from('soal').insert(soal), 'soal');

  const soalRows = await must(
    supabase.from('soal').select('id, topik_id, nomor, kunci').in('topik_id', TOPIK.map((t) => t.id)),
    'daftar soal',
  );
  const soalPerTopik = new Map();
  for (const row of soalRows) {
    if (!soalPerTopik.has(row.topik_id)) soalPerTopik.set(row.topik_id, []);
    soalPerTopik.get(row.topik_id).push(row);
  }
  for (const daftar of soalPerTopik.values()) daftar.sort((a, b) => a.nomor - b.nomor);

  const sesi = KELAS.flatMap((k, ki) => {
    const rows = TANGGAL_SELESAI.map((waktu, i) => ({
      id: idSesi(ki, i),
      kelas_id: k.id,
      topik_id: TOPIK[ki].id,
      kode_kelas: `${KODE_SESI[ki]}0${i + 1}`,
      status: 'selesai',
      dibuat_pada: new Date(waktu).toISOString(),
    }));
    rows.push({
      id: idSesi(ki, 4),
      kelas_id: k.id,
      topik_id: TOPIK[ki].id,
      kode_kelas: `${KODE_SESI[ki]}05`,
      status: 'aktif',
      dibuat_pada: new Date(sekarang - 2 * 60 * 60 * 1000).toISOString(),
    });
    return rows;
  });
  await must(supabase.from('sesi_kuis').insert(sesi), 'sesi kuis');

  const hasil = [];
  KELAS.forEach((_, ki) => {
    if (ki === KELAS_TANPA_JAWABAN) return;
    siswa.forEach((s, si) => {
      const pola = polaSiswa(si);
      pola.forEach((skor, sesiKe) => {
        if (skor === null) return;
        hasil.push({
          sesi_id: idSesi(ki, sesiKe),
          siswa_id: s.id,
          skor,
          total: 5,
          kelompok: kelompok(skor),
          dikirim_pada: new Date(TANGGAL_SELESAI[sesiKe] + 30 * 60 * 1000).toISOString(),
        });
      });
      // Kuis aktif juga diisi semua siswa di dua kelas penuh.
      const skorAktif = pola[3] ?? 4;
      hasil.push({
        sesi_id: idSesi(ki, 4),
        siswa_id: s.id,
        skor: skorAktif,
        total: 5,
        kelompok: kelompok(skorAktif),
        dikirim_pada: new Date(sekarang - 60 * 60 * 1000).toISOString(),
      });
    });
  });
  await insertBatches('hasil_siswa', hasil);

  const jawaban = [];
  for (const h of hasil) {
    const sesiRow = sesi.find((s) => s.id === h.sesi_id);
    const daftarSoal = soalPerTopik.get(sesiRow.topik_id) ?? [];
    for (const q of daftarSoal) {
      const benar = q.nomor <= h.skor;
      jawaban.push({
        sesi_id: h.sesi_id,
        siswa_id: h.siswa_id,
        soal_id: q.id,
        pilihan: benar ? q.kunci : q.kunci === 'A' ? 'B' : 'A',
        benar,
        dibuat_pada: h.dikirim_pada,
      });
    }
  }
  await insertBatches('jawaban', jawaban);

  const percobaan = await supabase.from('percobaan_kuis').insert(hasil);
  if (percobaan.error && !/does not exist|schema cache/i.test(percobaan.error.message)) {
    throw new Error(`percobaan_kuis: ${percobaan.error.message}`);
  }

  console.log('\nDemo guru siap dipakai.');
  console.log(`Guru   : ${GURU.email} / ${GURU.password}`);
  console.log(`Siswa  : murid1@${SISWA_DOMAIN} ... murid40@${SISWA_DOMAIN} / ${SISWA_PASSWORD}`);
  console.log(`Kelas  : ${KELAS.map((k) => `${k.mapel} ${k.nama} (${k.kode})`).join(' · ')}`);
  console.log(`Kuis aktif: ${KELAS.map((_, i) => `${KODE_SESI[i]}05`).join(', ')}`);
  console.log(
    `Data   : ${siswa.length} siswa/kelas; 7A & 7B mengerjakan 4 cek selesai + kuis aktif, 7C belum ada jawaban.`,
  );
  console.log('Kategori pendampingan 7A/7B: 4 belum, 8 setengah, 28 paham; 7C belum punya data.');
}

main().catch((err) => {
  console.error('\nGagal membuat demo:', err.message);
  process.exit(1);
});
