# Deploy Guru Pintarku ke VPS Jagoan Hosting

Panduan ini memakai Ubuntu 22.04/24.04, Node.js 22 LTS, systemd, Nginx, dan Certbot.
Arsitektur akhirnya:

```text
Internet -> Nginx :80/:443 -> Next.js :3000 (127.0.0.1) -> Supabase (eksternal)
```

Next.js tidak diekspos langsung ke internet. Port 3000 hanya mendengarkan localhost.

## 0. Yang perlu disiapkan

- VPS Jagoan Hosting dengan akses SSH root.
- IP VPS, misalnya `IP_VPS`.
- Domain, misalnya `DOMAIN_KAMU`.
- RAM minimal 1 GB. Untuk build Next.js, 2 GB lebih aman; jika hanya 1 GB, tambahkan swap.
- Akun Supabase yang sudah berisi skema dan seed proyek ini.
- Repo: `https://github.com/hsbysddq/gurupintar.git` (publik).

Ganti nilai berikut saat mengikuti panduan:

| Placeholder | Ganti dengan |
| --- | --- |
| `IP_VPS` | IPv4 VPS dari panel Jagoan Hosting |
| `DOMAIN_KAMU` | domain utama, tanpa `https://` |
| `gurupintar.example.com` | sama dengan `DOMAIN_KAMU` di file Nginx |

## 1. Atur DNS

Di panel DNS Jagoan Hosting, buat:

| Tipe | Nama | Nilai | TTL |
| --- | --- | --- | --- |
| A | `@` | `IP_VPS` | 300 |
| A | `www` | `IP_VPS` | 300 |

Tunggu propagasi. Cek dari komputer lokal:

```bash
nslookup DOMAIN_KAMU
```

## 2. Masuk ke VPS dan perbarui sistem

```bash
ssh root@IP_VPS

apt update && apt upgrade -y
apt install -y curl git nginx ufw
```

Jika port 80 sudah dipakai panel lain (CyberPanel/cPanel), cek dulu:

```bash
ss -tulpn | grep ':80'
```

Hentikan web server lain yang bentrok, atau gunakan reverse proxy bawaan panel tersebut.

## 3. Tambah swap jika RAM 1 GB

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

## 4. Pasang Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
bash nodesource_setup.sh
apt install -y nodejs
node -v    # harus v22.x
npm -v
command -v node   # biasanya /usr/bin/node
```

## 5. Buat pengguna dan folder aplikasi

Jangan menjalankan Next.js sebagai root.

```bash
adduser --disabled-password --gecos "" gurupintar
mkdir -p /var/www/gurupintar
chown -R gurupintar:gurupintar /var/www/gurupintar

sudo -u gurupintar git clone https://github.com/hsbysddq/gurupintar.git /var/www/gurupintar
```

Izinkan pengguna aplikasi menjalankan ulang layanan tanpa sandi:

```bash
echo 'gurupintar ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart gurupintar, /usr/bin/systemctl status gurupintar' > /etc/sudoers.d/gurupintar
chmod 440 /etc/sudoers.d/gurupintar
visudo -c
```

## 6. Pasang environment produksi

Dari komputer lokal (PowerShell, di folder proyek):

```powershell
scp .env.local root@IP_VPS:/tmp/gurupintar.env.local
```

Di VPS:

```bash
install -o gurupintar -g gurupintar -m 600 /tmp/gurupintar.env.local /var/www/gurupintar/.env.local
rm /tmp/gurupintar.env.local
```

Pastikan hanya nama variabel yang tercetak, bukan nilainya:

```bash
sudo -u gurupintar grep -o '^[A-Z_]*=' /var/www/gurupintar/.env.local
```

Variabel yang harus ada:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
KODE_UNDANGAN_GURU
```

Catatan:

- `.env.local` tidak pernah masuk Git.
- `NEXT_PUBLIC_*` ditanam saat build, jadi lakukan build setelah file ini ada.
- `ANTHROPIC_API_KEY` boleh kosong; fitur materi AI akan menampilkan error yang wajar dan materi cadangan tetap bisa dipakai.
- Jika memakai proyek Supabase baru, jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di SQL Editor Supabase.

## 7. Build aplikasi

```bash
sudo -u gurupintar -H bash -lc 'cd /var/www/gurupintar && npm ci && npm run build'
```

Jika build dihentikan karena kehabisan memori, pastikan swap aktif lalu ulangi.

## 8. Pasang layanan systemd

```bash
cp /var/www/gurupintar/deploy/gurupintar.service /etc/systemd/system/gurupintar.service
systemctl daemon-reload
systemctl enable --now gurupintar
systemctl status gurupintar --no-pager
```

Uji langsung dari VPS:

```bash
curl -I http://127.0.0.1:3000
```

Jika gagal, lihat log:

```bash
journalctl -u gurupintar -n 100 --no-pager
```

## 9. Pasang Nginx

```bash
cp /var/www/gurupintar/deploy/nginx-gurupintar.conf /etc/nginx/sites-available/gurupintar
nano /etc/nginx/sites-available/gurupintar
```

Ganti `gurupintar.example.com` dan `www.gurupintar.example.com` dengan `DOMAIN_KAMU`.

```bash
ln -s /etc/nginx/sites-available/gurupintar /etc/nginx/sites-enabled/gurupintar
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Uji:

```bash
curl -I http://DOMAIN_KAMU
```

## 10. Pasang HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d DOMAIN_KAMU -d www.DOMAIN_KAMU
certbot renew --dry-run
```

Certbot akan mengubah konfigurasi Nginx menjadi HTTPS dan menyiapkan pembaruan otomatis.

## 11. Aktifkan firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

Jika Jagoan Hosting menyediakan firewall eksternal di panel, buka juga port 22, 80, dan 443 di sana.

## 12. Verifikasi

```bash
systemctl status gurupintar --no-pager
curl -I https://DOMAIN_KAMU
ss -tulpn | grep ':3000'   # harus 127.0.0.1:3000, bukan 0.0.0.0:3000
```

Checklist manual:

- Buka `https://DOMAIN_KAMU/masuk`, masuk dengan akun guru.
- Sidebar tampil, menu aktif berpindah dengan benar.
- Pilih kelas di sidebar dan pastikan URL berubah ke `?kelas=...`.
- Buka `Ubah modul`, unggah PDF kecil, dan pastikan tidak muncul `413 Request Entity Too Large`.
- Buka kuis dan pastikan polling hasil berjalan.
- Jika `ANTHROPIC_API_KEY` terisi, uji pembuatan materi AI; jika kosong, pastikan error tampil rapi.

## 13. Alur update berikutnya

```bash
sudo -u gurupintar -H bash -lc 'cd /var/www/gurupintar && chmod +x deploy/deploy.sh && ./deploy/deploy.sh'
```

Atau manual:

```bash
sudo -u gurupintar -H bash -lc 'cd /var/www/gurupintar && git pull origin master && npm ci && npm run build'
systemctl restart gurupintar
```

## 14. Masalah umum

| Gejala | Penyebab dan solusi |
| --- | --- |
| `502 Bad Gateway` | Layanan mati. Cek `systemctl status gurupintar` dan `journalctl -u gurupintar -n 100`. |
| `504` saat membuat materi AI | Nginx memotong request 60 detik. Pastikan `proxy_read_timeout 90s` dan service sudah di-reload. |
| `413` saat unggah PDF | `client_max_body_size` terlalu kecil. Pastikan `12M`, lalu `nginx -t && systemctl reload nginx`. |
| Build mati di tengah | RAM habis. Tambahkan swap 2 GB lalu build ulang. |
| `EADDRINUSE :3000` | Ada proses lain di port 3000. Cek `ss -tulpn \| grep 3000` dan hentikan proses lama. |
| Halaman error Supabase | `.env.local` salah atau build dilakukan sebelum env ada. Perbaiki env lalu build ulang. |
| Port 80 dipakai panel | Hentikan Apache/CyberPanel yang bentrok atau gunakan proxy panel tersebut. |

## 15. Catatan keamanan

- Jangan commit `.env.local` atau menaruhnya di folder publik Nginx.
- Jangan buka port 3000 di firewall; cukup 22, 80, dan 443.
- Jalankan aplikasi sebagai pengguna `gurupintar`, bukan root.
- Ganti `KODE_UNDANGAN_GURU` secara berkala jika pendaftaran guru dibuka.
- Backup database dilakukan dari Supabase, bukan dari VPS ini.
