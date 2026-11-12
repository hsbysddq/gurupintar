// Membuat/memperbarui akun super-admin platform.
// Jalankan setelah migrasi-sekolah.sql:
// node --env-file=.env.local scripts/buat-super-admin.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nama = process.env.SUPER_ADMIN_NAMA;
const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!url || !serviceKey || !nama || !email || !password) {
  console.error('Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPER_ADMIN_NAMA, SUPER_ADMIN_EMAIL, dan SUPER_ADMIN_PASSWORD.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('SUPER_ADMIN_PASSWORD minimal 8 karakter.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const daftar = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (daftar.error) {
  console.error('Gagal membaca pengguna Auth:', daftar.error.message);
  process.exit(1);
}

let user = daftar.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (user) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email,
    password,
    email_confirm: true,
    app_metadata: { peran: 'super_admin' },
    user_metadata: { nama },
  });
  if (error) {
    console.error('Gagal memperbarui super-admin:', error.message);
    process.exit(1);
  }
  user = data.user;
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { peran: 'super_admin' },
    user_metadata: { nama },
  });
  if (error || !data.user) {
    console.error('Gagal membuat super-admin:', error?.message ?? 'tidak ada user');
    process.exit(1);
  }
  user = data.user;
}

const { error: galatProfil } = await supabase.from('pengguna').upsert(
  { id: user.id, nama, email, peran: 'super_admin', sekolah_id: null },
  { onConflict: 'id' },
);
if (galatProfil) {
  console.error('Gagal menyimpan profil super-admin:', galatProfil.message);
  process.exit(1);
}

console.log(`Super-admin siap: ${email}`);
