#!/usr/bin/env bash
# Daily Postgres dump for Docker Compose stack on EC2.
# Usage: backup-postgres.sh
# Cron example: 0 3 * * * /var/www/nest-book-store/docker/backup-postgres.sh
set -euo pipefail

DOCKER_DIR=/var/www/nest-book-store/docker
BACKUP_DIR=/var/www/nest-book-store/backups
KEEP_DAYS=14
PG_USER=user
PG_DB=bookstore

mkdir -p "$BACKUP_DIR"
cd "$DOCKER_DIR"

STAMP=$(date +%F)
OUT="$BACKUP_DIR/${PG_DB}-${STAMP}.dump"

docker compose exec -T postgres pg_dump -U "$PG_USER" "$PG_DB" > "$OUT"
chmod 600 "$OUT"

find "$BACKUP_DIR" -name "${PG_DB}-*.dump" -type f -mtime +"$KEEP_DAYS" -delete

echo "Backup OK: $OUT"
