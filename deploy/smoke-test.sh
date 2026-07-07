#!/usr/bin/env bash
# Run from GitHub Actions after deploy (public URL checks).
set -euo pipefail

BASE="${DEPLOY_BASE_URL:-https://nest.book-store.pl}"
BASE="${BASE%/}"

echo "==> GET $BASE/"
curl -sfS "$BASE/" | head -c 200 >/dev/null
echo " OK"

echo "==> GET $BASE/api/products"
RESP=$(curl -sfS "$BASE/api/products")
echo "$RESP" | grep -q '"products"' && echo " OK" || { echo "$RESP"; exit 1; }

echo "==> GET $BASE/api/config"
RESP=$(curl -sfS "$BASE/api/config")
echo "$RESP" | grep -q '"currency"' && echo " OK" || { echo "$RESP"; exit 1; }

if [[ -n "${DEPLOY_ADMIN_PASSWORD:-}" ]]; then
  echo "==> POST $BASE/api/users/login (admin)"
  LOGIN_RESP=$(curl -sfS -X POST "$BASE/api/users/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"admin@test.pl\",\"password\":\"$DEPLOY_ADMIN_PASSWORD\"}")
  echo "$LOGIN_RESP" | grep -q '"token"' && echo " OK" || { echo "$LOGIN_RESP"; exit 1; }
fi

echo "All smoke checks passed for $BASE"
