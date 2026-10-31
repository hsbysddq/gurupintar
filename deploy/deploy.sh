#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/gurupintar}"
BRANCH="${BRANCH:-master}"
SERVICE="${SERVICE:-gurupintar}"

cd "$APP_DIR"

echo "==> Mengambil kode terbaru dari origin/$BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

# Jangan build saat layanan masih memakai folder .next yang sama: Next.js
# menulis ulang .next dan dapat merusak proses yang sedang berjalan.
echo "==> Menghentikan layanan selama build"
trap 'sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true' EXIT
sudo systemctl stop "$SERVICE"

echo "==> Memasang dependensi"
npm ci

echo "==> Build produksi"
npm run build

echo "==> Menjalankan layanan"
sudo systemctl start "$SERVICE"
trap - EXIT
sudo systemctl --no-pager --lines=15 status "$SERVICE" || true

echo "==> Selesai. Buka domain produksi dan periksa halaman masuk serta dashboard guru."
