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

echo "==> Memasang dependensi"
npm ci

echo "==> Build produksi"
npm run build

echo "==> Menjalankan ulang layanan"
sudo systemctl restart "$SERVICE"
sudo systemctl --no-pager --lines=15 status "$SERVICE" || true

echo "==> Selesai. Buka domain produksi dan periksa halaman masuk serta dashboard guru."
