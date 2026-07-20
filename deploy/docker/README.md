# Etap 7a — Docker na nowym EC2 (strategia A)

Strategia **A**: domena **`nest.book-store.pl`** wskazuje bezpośrednio na **nową EC2** (publiczny IP lub Elastic IP).  
Stack: **Caddy + nest-api + PostgreSQL** przez Docker Compose — bez systemd Nest / systemowego Postgresa.

## Architektura

```text
Route 53  nest.book-store.pl  →  publiczny IP / Elastic IP → EC2
                                      │
                         docker compose up -d
                           ├── caddy      :80 / :443
                           ├── nest-api   :3004 (sieć wewnętrzna)
                           └── postgres   :5432 (sieć wewnętrzna)
```

## 1. Nowa EC2

|            |                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| AMI        | Ubuntu 24.04 / 26.04 LTS                                                                                                                  |
| Typ        | **t3.small** (2 GB)                                                                                                                       |
| Dysk       | 30 GB gp3                                                                                                                                 |
| Elastic IP | **opcjonalnie** — zalecane dla produkcji (stały IP pod A record `nest.book-store.pl`; bez EIP po stop/start EC2 trzeba zaktualizować DNS) |
| SG         | 22 (Twój IP), 80, 443 — **bez** 3004/5432                                                                                                 |

## 2. Bootstrap (raz)

Na EC2 jako `ubuntu` (SSH).

### Docker + katalogi

```bash
sudo apt update && sudo apt upgrade -y
# Docker CE + compose plugin (zob. oficjalne docs lub apt install docker.io docker-compose-v2)
sudo usermod -aG docker ubuntu
# wyloguj / zaloguj

sudo mkdir -p /var/www/nest-book-store/{releases,shared,docker}
sudo chown -R ubuntu:ubuntu /var/www/nest-book-store
```

### Pliki z repo na serwer

Komendy `cp deploy/docker/...` zakładają, że folder `deploy/` jest już na EC2. **Wybierz jedną opcję:**

**A — `git clone` na EC2** (najprościej):

```bash
git clone https://github.com/TWOJ_USER/nest.book-store.com.pl.git
cd nest.book-store.com.pl
```

**B — `scp` z laptopa** (bez klonowania całego repo; Git Bash / WSL):

```bash
KEY=~/.ssh/klucz.pem
EC2=ubuntu@PublicIPv4
PROJECT=/ścieżka/do/nest.book-store.com.pl

scp -i "$KEY" \
  "$PROJECT/deploy/docker/docker-compose.yml" \
  "$PROJECT/deploy/docker/Caddyfile" \
  "$PROJECT/deploy/docker/.env.postgres.example" \
  "$PROJECT/deploy/docker/.env.production.example" \
  "$EC2:~/bootstrap/"
```

Przy opcji B na EC2 użyj `~/bootstrap/` zamiast `deploy/docker/` w komendach poniżej.

### Konfiguracja (na EC2)

```bash
# opcja A — po git clone, z katalogu repo:
cp deploy/docker/docker-compose.yml deploy/docker/Caddyfile /var/www/nest-book-store/docker/
cp deploy/docker/.env.postgres.example /var/www/nest-book-store/shared/.env.postgres
cp deploy/docker/.env.production.example /var/www/nest-book-store/shared/.env.production

# opcja B — po scp do ~/bootstrap/:
# cp ~/bootstrap/docker-compose.yml ~/bootstrap/Caddyfile /var/www/nest-book-store/docker/
# cp ~/bootstrap/.env.postgres.example /var/www/nest-book-store/shared/.env.postgres
# cp ~/bootstrap/.env.production.example /var/www/nest-book-store/shared/.env.production

chmod 600 /var/www/nest-book-store/shared/.env.*

# Uzupełnij hasła, JWT, Stripe — DB_HOST=postgres, HOST=0.0.0.0
nano /var/www/nest-book-store/shared/.env.postgres
nano /var/www/nest-book-store/shared/.env.production
```

Folder `deploy/` z repo **nie musi** zostać na EC2 — liczą się pliki w `/var/www/nest-book-store/`.  
Po pierwszym deployu GitHub Actions sam aktualizuje `docker-compose.yml`, `Caddyfile` i skrypt w `/docker/`; pliki `.env` w `/shared/` edytujesz ręcznie (sekrety nie idą z repo).

DNS: **A `nest.book-store.pl` → publiczny IP** tej maszyny (strategia A). Z Elastic IP adres nie zmienia się po restarcie instancji.

## 3. Pierwszy start (ręcznie)

Na laptopie (z kontekstem `backend/`):

```bash
docker build -t nest-book-store-api:manual -f deploy/docker/backend.Dockerfile backend/
docker save nest-book-store-api:manual | gzip > api-image.tar.gz
scp -i klucz.pem api-image.tar.gz ubuntu@EC2_HOST:~/
```

Na EC2:

```bash
gunzip -c ~/api-image.tar.gz | docker load
mkdir -p /var/www/nest-book-store/releases/manual1/frontend
# wgraj frontend/dist (npm run build lokalnie z VITE_BACKEND_URL=https://nest.book-store.pl/api)
ln -sfn /var/www/nest-book-store/releases/manual1 /var/www/nest-book-store/current

cd /var/www/nest-book-store/docker
echo 'API_IMAGE=nest-book-store-api:manual' > .env
docker compose up -d

# opcjonalnie seed
docker compose exec nest-api node dist/src/scripts/seed.js
```

Smoke: `bash deploy/smoke-test.sh` z `DEPLOY_BASE_URL=https://nest.book-store.pl`.

## 4. CD — GitHub Actions

Workflow: [`.github/workflows/deploy-ec2-docker.yml`](../../.github/workflows/deploy-ec2-docker.yml)

Secrets / Variables (jak dotychczas): `EC2_HOST`, `EC2_SSH_KEY`, `DEPLOY_BASE_URL=https://nest.book-store.pl`, klucze Vite, opcjonalnie `DEPLOY_ADMIN_PASSWORD`.

## 5. Pliki w tym katalogu

| Plik                         | Rola                                 |
| ---------------------------- | ------------------------------------ |
| `docker-compose.yml`         | caddy + nest-api + postgres          |
| `Caddyfile`                  | TLS + proxy dla `nest.book-store.pl` |
| `backend.Dockerfile`         | obraz Nest                           |
| `.env.*.example`             | szablony sekretów                    |
| `activate-release-docker.sh` | symlink `current` + `compose up`     |

## Uwagi

- `HOST=0.0.0.0` — wymagane, żeby Caddy w sieci Compose doszedł do Nest.
- `DB_HOST=postgres` — nazwa serwisu Compose, nie `localhost`.
- Starej EC2 ze systemd **nie** używaj równolegle na tej samej domenie.
- Backup DB: `docker compose exec -T postgres pg_dump -U bookstore bookstore > backup.dump`
