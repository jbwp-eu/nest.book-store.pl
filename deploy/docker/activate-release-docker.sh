#!/usr/bin/env bash
# Run on EC2 as ubuntu after Docker CD rsync.
# Usage: activate-release-docker.sh <git-sha> [api-image-tag]
set -euo pipefail

APP_ROOT=/var/www/nest-book-store
DOCKER_DIR="$APP_ROOT/docker"
RELEASE_SHA="${1:?Usage: activate-release-docker.sh <git-sha> [api-image]}"
API_IMAGE="${2:-nest-book-store-api:$RELEASE_SHA}"

RELEASE="$APP_ROOT/releases/$RELEASE_SHA"
FRONTEND_DIST="$RELEASE/frontend/dist"

[[ -d "$FRONTEND_DIST" ]] || { echo "Missing $FRONTEND_DIST"; exit 1; }
[[ -f "$DOCKER_DIR/docker-compose.yml" ]] || { echo "Missing $DOCKER_DIR/docker-compose.yml"; exit 1; }
[[ -f "$APP_ROOT/shared/.env.production" ]] || { echo "Missing shared/.env.production"; exit 1; }
[[ -f "$APP_ROOT/shared/.env.postgres" ]] || { echo "Missing shared/.env.postgres"; exit 1; }

ln -sfn "$RELEASE" "$APP_ROOT/current"

cd "$DOCKER_DIR"
printf 'API_IMAGE=%s\n' "$API_IMAGE" > .env
docker compose pull nest-api 2>/dev/null || true
docker compose up -d

echo "Waiting for API..."
for i in $(seq 1 30); do
  if docker compose exec -T nest-api node -e \
    "require('http').get('http://127.0.0.1:3004/api/config',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"; then
    echo "Activated $RELEASE_SHA ($API_IMAGE)"
    exit 0
  fi
  sleep 2
done

echo "API did not become healthy in time"
docker compose logs --tail 80 nest-api
exit 1
