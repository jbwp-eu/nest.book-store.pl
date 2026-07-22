#!/usr/bin/env bash
# Daily Postgres dump for Docker Compose stack on EC2.
# Credentials: /var/www/nest-book-store/shared/.env.postgres (POSTGRES_USER, POSTGRES_DB)
# Usage: backup-postgres.sh
# Cron: 0 3 * * * /var/www/nest-book-store/docker/backup-postgres.sh
set -euo pipefail

DOCKER_DIR=/var/www/nest-book-store/docker
BACKUP_DIR=/var/www/nest-book-store/backups
ENV_FILE=/var/www/nest-book-store/shared/.env.postgres
KEEP_DAYS=14

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }

# Load POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB (same as compose)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:?POSTGRES_USER missing in $ENV_FILE}"
PG_DB="${POSTGRES_DB:?POSTGRES_DB missing in $ENV_FILE}"

mkdir -p "$BACKUP_DIR"
cd "$DOCKER_DIR"

STAMP=$(date +%F)
OUT="$BACKUP_DIR/${PG_DB}-${STAMP}.dump"

docker compose exec -T postgres pg_dump -U "$PG_USER" "$PG_DB" > "$OUT"
chmod 600 "$OUT"

find "$BACKUP_DIR" -name "${PG_DB}-*.dump" -type f -mtime +"$KEEP_DAYS" -delete

echo "Backup OK: $OUT (user=$PG_USER db=$PG_DB)"
