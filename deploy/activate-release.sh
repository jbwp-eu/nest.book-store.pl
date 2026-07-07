#!/usr/bin/env bash
# Run on EC2 as ubuntu after rsync (GitHub Actions CD).
# Install copy: sudo cp deploy/activate-release.sh /usr/local/bin/activate-release.sh
set -euo pipefail

APP_ROOT=/var/www/nest-book-store
RELEASE_SHA="${1:?Usage: activate-release.sh <git-sha>}"

RELEASE="$APP_ROOT/releases/$RELEASE_SHA"
BACKEND="$RELEASE/backend"

[[ -d "$RELEASE" ]] || { echo "Missing release: $RELEASE"; exit 1; }
[[ -f "$BACKEND/package.json" ]] || { echo "Missing $BACKEND/package.json"; exit 1; }
[[ -d "$BACKEND/dist" ]] || { echo "Missing $BACKEND/dist"; exit 1; }
[[ -f "$APP_ROOT/shared/.env.production" ]] || {
  echo "Missing $APP_ROOT/shared/.env.production"
  exit 1
}

cd "$BACKEND"
npm ci --omit=dev

ln -sfn "$RELEASE" "$APP_ROOT/current"

sudo systemctl restart nest-book-store
sleep 3

curl -sf http://127.0.0.1:3004/api/config >/dev/null
echo "Activated $RELEASE_SHA"
