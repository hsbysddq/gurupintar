import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Muat .env.local untuk pemakaian lokal. Di CI, env sudah disediakan oleh runner.
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const baris of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const cocok = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(baris);
    if (cocok && process.env[cocok[1]] === undefined) {
      process.env[cocok[1]] = cocok[2].replace(/^["']|["']$/g, '');
    }
  }
}

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { createClient } = require('@supabase/supabase-js');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasil = [];
function cek(nama, ok, detail = '') {
  hasil.push(ok);
  console.log(`${ok ? 'OK   ' : 'GAGAL'} ${nama}${detail ? ` — ${detail}` : ''}`);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('E2E memerlukan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function login(email, password) {
  const res = await minta('/api/auth/masuk', null, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res;
}

async function minta(jalur, cookies, init = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${jalur}`, {
      redirect: 'manual',
      ...init,
      headers: {
        ...(cookies ? { cookie: cookies } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    return { status: 0, lokasi: null, teks: '', json: null, cookies: '', headers: null, galat: String(err) };
  }

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const teks = await res.text();
  let json = null;
  try {
    json = JSON.parse(teks);
  } catch {
    // respons HTML
  }
  return {
    status: res.status,
    lokasi: res.headers.get('location'),
    teks,
    json,
    cookies: setCookie.map((c) => c.split(';')[0]).join('; '),
    headers: res.headers,
  };
}

async function hitung(tabel) {
  const { count, error } = await admin.from(tabel).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${tabel}: ${error.message}`);
  return count;
}

let idKelasUji = null;

try {
  const aplikasi = await minta('/masuk');
  cek('Aplikasi berjalan di BASE_URL', aplikasi.status === 200, `status ${aplikasi.status}`);
  cek(
    'Header X-Frame-Options = DENY',
    aplikasi.headers?.get('x-frame-options') === 'DENY',
    String(aplikasi.headers?.get('x-frame-options')),
  );
  cek(
    'Header X-Content-Type-Options = nosniff',
    aplikasi.headers?.get('x-content-type-options') === 'nosniff',
    String(aplikasi.headers?.get('x-content-type-options')),
  );

  const tidakAda = await minta('/halaman-tidak-ada');
  cek(
    'Halaman 404 menampilkan pesan',
    tidakAda.status === 404 && tidakAda.teks.includes('Halaman tidak ditemukan'),
    `status ${tidakAda.status}`,
  );

  const harapan = {
    pengguna: 41,
    kelas: 1,
    keanggotaan_kelas: 40,
    topik: 1,
    soal: 5,
    sesi_kuis: 5,
    hasil_siswa: 132,
    jawaban: 190,
    materi: 0,
  };
  for (const [tabel, jumlah] of Object.entries(harapan)) {
    const nyata = await hitung(tabel);
    cek(`Jumlah ${tabel} = ${jumlah}`, nyata === jumlah, `ditemukan ${nyata}`);
  }

  const tanpaLogin = await minta('/api/guru/sesi');
  cek('API guru tanpa login = 401', tanpaLogin.status === 401, `status ${tanpaLogin.status}`);

  const guru = await login('guru@demo.gurupintar.id', 'GuruPintar123!');
  const siswa = await login('siswa1@demo.gurupintar.id', 'SiswaPintar123!');
  cek('Login guru', guru.status === 200 && guru.cookies.length > 0);
  cek('Login siswa', siswa.status === 200 && siswa.cookies.length > 0);

  const siswaKeGuru = await minta('/api/guru/sesi', siswa.cookies);
  cek('Siswa ditolak di API guru = 403', siswaKeGuru.status === 403, `status ${siswaKeGuru.status}`);
  const guruKeSiswa = await minta('/api/siswa/kelas', guru.cookies);
  cek('Guru ditolak di API siswa = 403', guruKeSiswa.status === 403, `status ${guruKeSiswa.status}`);

  const kelasGuru = await minta('/api/guru/kelas', guru.cookies);
  const kelasSiswa = await minta('/api/siswa/kelas', siswa.cookies);
  cek(
    'Guru melihat kelas demo',
    kelasGuru.status === 200 && kelasGuru.json?.some?.((k) => k.kodeUndangan === 'KEL7A'),
  );
  cek(
    'Siswa melihat kelas demo',
    kelasSiswa.status === 200 && kelasSiswa.json?.some?.((k) => k.kodeUndangan === 'KEL7A'),
  );

  const buat = await minta('/api/guru/kelas', guru.cookies, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nama: `Kelas E2E ${Date.now()}`, mapel: 'Biologi' }),
  });
  idKelasUji = buat.json?.id ?? null;
  const kodeKelas = buat.json?.kodeUndangan;
  cek('Kelas E2E dibuat', buat.status === 201 && Boolean(idKelasUji), kodeKelas);

  const gabung = await minta('/api/siswa/kelas', siswa.cookies, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kode: kodeKelas }),
  });
  cek('Siswa bergabung tanpa kuis aktif', gabung.status === 200, `status ${gabung.status}`);

  const gabungUlang = await minta('/api/siswa/kelas', siswa.cookies, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kode: kodeKelas }),
  });
  cek('Bergabung ulang idempoten', gabungUlang.status === 200, `status ${gabungUlang.status}`);

  const kodeSalah = await minta('/api/siswa/kelas', siswa.cookies, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kode: 'ZZZZZ' }),
  });
  cek('Kode kelas salah = 404', kodeSalah.status === 404, `status ${kodeSalah.status}`);

  if (idKelasUji) {
    const daftarSiswa = await minta('/api/siswa/kelas', siswa.cookies);
    const kelasUjiSiswa = daftarSiswa.json?.find?.((k) => k.id === idKelasUji);
    cek('Kelas E2E muncul di daftar siswa', Boolean(kelasUjiSiswa));
    cek('Kelas E2E belum punya kuis aktif', kelasUjiSiswa?.kuisAktif === null);

    const buka = await minta('/api/guru/sesi', guru.cookies, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kelasId: idKelasUji }),
    });
    cek('Guru membuka kuis E2E', buka.status === 201, `status ${buka.status}`);

    const daftarSiswa2 = await minta('/api/siswa/kelas', siswa.cookies);
    const denganKuis = daftarSiswa2.json?.find?.((k) => k.id === idKelasUji);
    cek(
      'Kuis E2E muncul di daftar siswa',
      denganKuis?.kuisAktif?.kodeKelas === buka.json?.kodeKelas,
      JSON.stringify(denganKuis?.kuisAktif),
    );

    const riwayat = await minta(`/api/siswa/kelas/sesi?kelas=${idKelasUji}`, siswa.cookies);
    cek('Riwayat sesi E2E = 200', riwayat.status === 200, `status ${riwayat.status}`);
    cek('Riwayat sesi E2E berisi satu sesi', riwayat.json?.length === 1, String(riwayat.json?.length));
    cek(
      'Sesi E2E belum dikerjakan siswa',
      riwayat.json?.[0]?.statusMateri === 'belum-mengerjakan',
      String(riwayat.json?.[0]?.statusMateri),
    );
    cek('Riwayat sesi tidak memuat kelompok', !riwayat.teks.includes('"kelompok"'));

    const arsip = await minta('/api/guru/kelas', guru.cookies, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: idKelasUji, arsip: true }),
    });
    cek('Guru mengarsipkan kelas E2E', arsip.status === 200, `status ${arsip.status}`);

    const daftarSiswa3 = await minta('/api/siswa/kelas', siswa.cookies);
    cek('Kelas arsip hilang dari daftar siswa', !daftarSiswa3.json?.some?.((k) => k.id === idKelasUji));
  }
} catch (err) {
  cek('E2E berjalan tanpa error tak terduga', false, err instanceof Error ? err.message : String(err));
} finally {
  if (idKelasUji) {
    const hapus = await admin.from('kelas').delete().eq('id', idKelasUji);
    cek('Kelas E2E dibersihkan', !hapus.error, hapus.error?.message);
  }
}

const sesiDemo = await admin.from('sesi_kuis').select('status').eq('kode_kelas', 'A7K2P').maybeSingle();
cek('Sesi demo A7K2P tetap aktif', sesiDemo.data?.status === 'aktif', String(sesiDemo.data?.status));

const gagal = hasil.filter((ok) => !ok).length;
console.log(`\nRingkasan E2E: ${hasil.length - gagal} lulus, ${gagal} gagal.`);
process.exit(gagal === 0 ? 0 : 1);
