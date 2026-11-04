import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = {};
const isi = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
for (const baris of isi.split(/\r?\n/)) {
  const cocok = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (cocok) env[cocok[1]] = cocok[2];
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tabel = [
  'pengguna',
  'transaksi_koin',
  'kelas',
  'keanggotaan_kelas',
  'topik',
  'soal',
  'sesi_kuis',
  'jadwal_kuis',
  'jawaban',
  'hasil_siswa',
  'percobaan_kuis',
  'blokir_kuis',
  'materi',
  'materi_pustaka',
  'tindakan_pendampingan_kuis',
];

const kolom = [
  ['kelas', ['warna', 'sampul', 'diarsipkan_pada']],
  ['pengguna', ['email', 'koin']],
  ['keanggotaan_kelas', ['nama_tampil', 'preferensi_format']],
  ['soal', ['tipe', 'gambar']],
  ['jawaban', ['id', 'sesi_id', 'siswa_id', 'soal_id', 'pilihan', 'benar', 'belum_dinilai', 'dibuat_pada']],
  ['hasil_siswa', ['sesi_id', 'siswa_id', 'skor', 'total', 'kelompok', 'dikirim_pada']],
  ['percobaan_kuis', ['id', 'sesi_id', 'siswa_id', 'skor', 'total', 'kelompok', 'dikirim_pada']],
  ['sesi_kuis', ['id', 'kelas_id', 'topik_id', 'kode_kelas', 'status', 'dibuat_pada']],
  ['jadwal_kuis', ['sesi_id', 'buka_pada', 'tutup_pada', 'dibuat_pada', 'diperbarui_pada']],
  ['blokir_kuis', ['sesi_id', 'siswa_id', 'jumlah', 'terblokir', 'jumlah_blokir', 'diblokir_pada', 'dibuka_pada', 'diperbarui_pada']],
  ['materi_pustaka', ['id', 'guru_id', 'kelas_id', 'bab', 'judul', 'isi', 'sumber', 'asal', 'dibuat_pada', 'diperbarui_pada']],
  ['tindakan_pendampingan_kuis', ['sesi_id', 'siswa_id', 'kelas_id', 'kategori', 'tindakan', 'diperbarui_pada']],
];

function ringkasError(error) {
  if (!error) return null;
  return { code: error.code ?? null, message: error.message ?? String(error) };
}

console.log('TABEL');
for (const nama of tabel) {
  const hasil = await db.from(nama).select('*').limit(1);
  console.log(`${nama}: ${hasil.error ? 'HILANG/ERROR' : 'ADA'}${hasil.error ? ` — ${JSON.stringify(ringkasError(hasil.error))}` : ''}`);
}

console.log('\nKOLOM');
for (const [nama, daftar] of kolom) {
  for (const kol of daftar) {
    const hasil = await db.from(nama).select(kol).limit(1);
    console.log(`${nama}.${kol}: ${hasil.error ? 'HILANG/ERROR' : 'ADA'}${hasil.error ? ` — ${JSON.stringify(ringkasError(hasil.error))}` : ''}`);
  }
}

const acak = crypto.randomUUID();
const acak2 = crypto.randomUUID();
const acak3 = crypto.randomUUID();

console.log('\nFUNGSI RPC');
const rpc = [
  ['simpan_hasil', { p_sesi: acak, p_siswa: acak2, p_jawaban: [], p_skor: 0, p_total: 1, p_kelompok: 'belum' }],
  ['hapus_anggota_kelas', { p_kelas: acak, p_siswa: acak2 }],
  ['simpan_nilai_esai', { p_sesi: acak, p_siswa: acak2, p_soal: acak3, p_benar: true, p_skor: 1, p_total: 1, p_kelompok: 'sudah' }],
  ['potong_koin', { p_guru: acak, p_jumlah: 1, p_keterangan: 'uji' }],
  ['tambah_koin', { p_guru: acak, p_jumlah: 1, p_jenis: 'topup', p_keterangan: 'uji' }],
];
for (const [nama, arg] of rpc) {
  const hasil = await db.rpc(nama, arg);
  const pesan = hasil.error?.message ?? '';
  if (!hasil.error) console.log(`${nama}: ADA`);
  else if (
    pesan.includes('SESI_TIDAK_ADA') ||
    pesan.includes('JAWABAN_TIDAK_ADA') ||
    pesan.includes('GURU_TIDAK_ADA')
  )
    console.log(`${nama}: ADA (argumen uji ditolak seperti seharusnya)`);
  else console.log(`${nama}: HILANG/ERROR — ${JSON.stringify(ringkasError(hasil.error))}`);
}
