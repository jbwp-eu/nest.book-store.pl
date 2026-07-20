# Deploy AWS — nest.book-store.pl (plan etapowy)

Plan wdrożenia aplikacji **NestJS + React + PostgreSQL** na AWS z GitHub Actions, reverse proxy (**Caddy** lub **NGINX**) i opcją Docker.

## Rekomendacja architektury (start)

### Jeden EC2 na start — tak

| Decyzja             | Rekomendacja                                         | Dlaczego                                                                           |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Liczba EC2          | **1** (app + DB + reverse proxy)                     | Najprostsze, tanie, wystarczające na mały ruch                                     |
| VPC                 | **Default VPC** na etapie 1                          | Zero konfiguracji sieci; później własna VPC                                        |
| Subnet              | **Public** + auto public IP                          | Proxy (Caddy/NGINX) musi być dostępny z internetu (80/443)                         |
| PostgreSQL          | **Na tym samym EC2**, `listen_addresses = localhost` | Zgodnie z założeniem; port 5432 **nie** w Security Group                           |
| Load Balancer (ALB) | **Nie** na start                                     | Koszt + złożoność bez korzyści przy 1 instancji                                    |
| Lambda              | **Później** (etap 4)                                 | Np. mail po zakupie — [order-confirmation-lambda.md](order-confirmation-lambda.md) |
| Reverse proxy       | **Caddy** (prościej) **lub NGINX**                   | Caddy: [Caddyfile.example](Caddyfile.example); NGINX: [nginx.md](nginx.md)         |
| S3 + CloudFront     | **Już w projekcie**                                  | Obrazy produktów (admin upload) — zostawić                                         |
| Elastic IP          | **Opcjonalnie**                                      | Bez EIP: po stop/start EC2 trzeba zaktualizować DNS w Route 53                     |

### Dwa EC2 — dopiero etap 3 (opcjonalnie)

```
Internet → EC2 #1 (public): Caddy **lub** NGINX + Nest + frontend static
              ↓  (prywatna komunikacja, SG)
           EC2 #2 (private subnet): PostgreSQL
```

## Schemat ruchu (etap 1 — jeden EC2)

Wariant **Caddy** (domyślny w przykładzie):

```
Użytkownik
    │
    ▼
Route 53  nest.book-store.pl  →  A record → EC2 public IP
    │
    ▼
Caddy :443 (Let's Encrypt)
    ├── /              →  pliki statyczne  frontend/dist
    ├── /api/*         →  reverse_proxy 127.0.0.1:3004
    └── /socket.io/*   →  reverse_proxy 127.0.0.1:3004  (WebSocket)
    │
    ▼
NestJS (systemd) :3004
    │
    ▼
PostgreSQL :5432  (tylko 127.0.0.1)
```

Wariant **NGINX**: ta sama ścieżka ruchu, TLS przez **certbot** — [nginx.md](nginx.md).

**Stripe webhook:** `https://nest.book-store.pl/api/webhooks/stripe` (przez proxy → Nest).

---

## Security Group (etap 1)

| Port | Źródło                                  | Usługa                          |
| ---- | --------------------------------------- | ------------------------------- |
| 22   | Twoje IP (+ opcjonalnie GitHub Actions) | SSH                             |
| 80   | 0.0.0.0/0                               | HTTP (ACME / redirect → HTTPS)  |
| 443  | 0.0.0.0/0                               | HTTPS (Caddy lub NGINX)         |
| 3004 | —                                       | **zamknięty** (tylko localhost) |
| 5432 | —                                       | **zamknięty** (tylko localhost) |

---

## Layout na serwerze (etap 1)

```
/var/www/nest-book-store/          # owner: ubuntu
├── current -> releases/manual1/   # symlink na aktywny release
├── releases/
│   ├── manual1/                   # pierwszy deploy ręczny
│   │   ├── backend/dist/
│   │   └── frontend/dist/
│   └── <sha>/                     # kolejne deploye (CI/CD)
│       ├── backend/dist/
│       └── frontend/dist/
└── shared/
    └── .env.production            # sekrety (chmod 600)
```

PostgreSQL: baza systemowa (`/var/lib/postgresql/...`), użytkownik `bookstore`, DB `bookstore`.

---

## Etapy wdrożenia

### Etap 0 — przygotowanie lokalne (teraz)

- [ ] Repo na GitHubie (`main` jako branch deploy)
- [ ] Domena / subdomena w Route 53, np. `nest.book-store.pl`
- [ ] Klucze: Stripe (test lub live), JWT_SECRET, AWS S3/CloudFront (opcjonalnie)
- [ ] README root + backend — gotowe

### Etap 1 — infrastruktura AWS (ręcznie, Console)

1. **Key pair** EC2 (`.pem`)
2. **Security group** (jak wyżej)
3. **EC2** Ubuntu 24.04 LTS, `t3.small` (lub `t3.micro` na testy), 30 GB gp3
4. **Route 53** — rekord A → public IP EC2
5. (Opcja) **Elastic IP** — przypisz do instancji, żeby IP się nie zmieniało

**VPC:** użyj **default VPC** — nie tworzysz własnej na start.

### Etap 2 — bootstrap serwera (SSH, jednorazowo)

Na EC2 jako `ubuntu`:

1. Node.js 22, git, build-essential, rsync
2. **PostgreSQL** — instalacja, utworzenie DB/użytkownika, `listen_addresses = 'localhost'` → [Instalacja PostgreSQL na EC2](#instalacja-postgresql-na-ec2)
3. **Reverse proxy** — wybierz **jeden**:
   - **Caddy** (prościej, auto-TLS) — [Caddyfile.example](Caddyfile.example)
   - **NGINX** + certbot — [nginx.md](nginx.md), [nginx-nest-book-store.example](nginx-nest-book-store.example)
4. Katalogi aplikacji (jednorazowo, wymaga `sudo` — `/var/www` domyślnie należy do root):

```bash
sudo mkdir -p /var/www/nest-book-store/{releases,shared}
sudo chown -R ubuntu:ubuntu /var/www/nest-book-store
```

Po `chown` użytkownik `ubuntu` może tworzyć podkatalogi w `releases/` (scp, deploy) bez `sudo`.

5. Plik `shared/.env.production` (backend env: DB\_\*, JWT, STRIPE, CURRENCY…)
6. **systemd** — usługa Nest (`deploy/nest-book-store.service.example`)
7. `activate-release.sh` w `/usr/local/bin/`
8. Sudoers: `ubuntu` może `systemctl restart nest-book-store`

Seed i logowanie admina — dopiero po wgraniu `dist/` → [Pierwszy deploy ręczny](#pierwszy-deploy-ręczny), krok 3.

**Pierwszy deploy ręczny** → [Pierwszy deploy ręczny](#pierwszy-deploy-ręczny) (po zakończeniu bootstrapu).

---

## Instalacja PostgreSQL na EC2

Instrukcja dla **Ubuntu 24.04 LTS** na jednej instancji EC2 (Postgres tylko lokalnie — Nest łączy się przez `127.0.0.1`). Port **5432 nie otwieraj** w Security Group.

### 1. Instalacja pakietów

Po SSH na instancję:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql --no-pager
```

Domyślna wersja na Ubuntu 24.04 to PostgreSQL **18**. Sprawdzenie:

```bash
psql --version
```

### 2. Użytkownik i baza aplikacji

Ustal silne hasło (zapisz je — trafi też do `shared/.env.production` jako `DB_PASSWORD`):

```bash
sudo -u postgres psql

prompt: postgres=#
To polecenie otwiera konsolę PostgreSQL jako użytkownik systemowy postgres (superuser bazy). Ten użytkownik ma pełne uprawnienia administracyjne w DB.
```

W konsoli `psql`:

```sql
CREATE USER bookstore WITH PASSWORD 'TU_WSTAW_SILNE_HASLO';
CREATE DATABASE bookstore OWNER bookstore;
GRANT ALL PRIVILEGES ON DATABASE bookstore TO bookstore;
\q
```

lub: sudo -u postgres psql -c "CREATE USER bookstore WITH PASSWORD 'haslo';"

Test logowania:

```bash
psql -h 127.0.0.1 -U bookstore -d bookstore -W
# po teście: \q
```

### 3. Nasłuch tylko na localhost

Edytuj `postgresql.conf` (ścieżka zależy od wersji; na PG 16):

```bash
sudo nano /etc/postgresql/18/main/postgresql.conf
```

Ustaw:

```ini
listen_addresses = 'localhost'
port = 5432
```

Zapisz plik.

### 4. Uwierzytelnianie (`pg_hba.conf`)

```bash
sudo nano /etc/postgresql/18/main/pg_hba.conf
```

Dla połączeń lokalnych powinny być m.in.:

```text
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

**Nie dodawaj** reguł `0.0.0.0/0` — baza ma być dostępna wyłącznie z tego samego serwera.

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 5. Weryfikacja (tylko lokalnie)

```bash
sudo ss -tlnp | grep 5432
# oczekiwane: 127.0.0.1:5432 (nie 0.0.0.0:5432)

psql -h 127.0.0.1 -U bookstore -d bookstore -c 'SELECT current_database(), current_user;'
```

Z zewnątrz EC2 połączenie na `:5432` **nie powinno** działać (SG i tak blokuje port).

### 6. Zmienne w `.env` backendu (produkcja)

W pliku `/var/www/nest-book-store/shared/.env.production` (lub `backend/.env` przy pierwszym seedzie):

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=bookstore
DB_PASSWORD=TU_WSTAW_SILNE_HASLO
DB_NAME=bookstore
```

Pozostałe sekrety (JWT, Stripe, `ADMIN_PASSWORD` itd.) — jak w `backend/.env.example`.

Uprawnienia pliku:

```bash
chmod 600 /var/www/nest-book-store/shared/.env.production
```

### 7. Seed danych (jednorazowo)

**Kiedy:** po wgraniu `backend/dist/` na serwer ([Pierwszy deploy ręczny](#pierwszy-deploy-ręczny), krok 2–3) — **nie** podczas samego bootstrapu Postgresa (brak jeszcze `dist/`).

Z katalogu release backendu:

```bash
cd /var/www/nest-book-store/releases/manual1/backend
# po symlinku current: cd /var/www/nest-book-store/current/backend
cp /var/www/nest-book-store/shared/.env.production .env
npm ci --omit=dev
npm run seed:prod -- -i
# lub: node dist/src/scripts/seed.js -i
```

Weryfikacja seeda (API — frontend nie jest potrzebny):

```bash
curl -sS http://127.0.0.1:3004/api/products | head
```

Logowanie admina **w przeglądarce** (`admin@test.pl` + `ADMIN_PASSWORD` z `.env`) dopiero po pełnym deployu: frontend wgrany, `ln -sfn` → `current`, restart Nest (i ewentualnie proxy po zmianie konfiguracji) — patrz [Smoke test](#4-smoke-test).

### 8. TypeORM na produkcji

W `backend/src/app.module.ts` jest `synchronize: false` — Nest **nie** tworzy tabel przy starcie. Przy **pierwszym** `npm run seed:prod -- -i` seeder sam wywoła `dataSource.synchronize()`, jeśli tabela `products` nie istnieje (pusta baza). Kolejne zmiany schematu wprowadzaj migracjami TypeORM.

### 9. Backup (zalecane)

Prosty dump ręczny:

```bash
sudo -u postgres pg_dump -Fc bookstore > ~/bookstore-$(date +%F).dump
```

Przywracanie:

```bash
sudo -u postgres pg_restore -d bookstore --clean --if-exists ~/bookstore-YYYY-MM-DD.dump
```

Na start wystarczy okresowy dump (cron) lub snapshot wolumenu EBS instancji.

### 10. Rozwiązywanie problemów

| Problem                              | Co sprawdzić                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connection refused` z Nest          | Czy Postgres działa: `systemctl status postgresql`                                                                                                                 |
| `password authentication failed`     | Zgodność `DB_PASSWORD` w `.env` z hasłem użytkownika `bookstore`                                                                                                   |
| `relation "products" does not exist` | Baza pusta — seed tworzy schemat przy pierwszym `-i`; na starym `dist/` uruchom jednorazowo `node -e "..."` (patrz sekcja 8) lub przebuduj backend i wgraj `dist/` |
| Port 5432 widoczny z internetu       | `listen_addresses`, SG — ma być tylko localhost + brak reguły 5432 w SG                                                                                            |

---

## Pierwszy deploy ręczny

Po zakończeniu **Etapu 1** (EC2, DNS) i **Etapu 2** (Postgres, Caddy, systemd, `.env.production`) wgraj aplikację **raz ręcznie**, zanim uruchomisz CI/CD. W kroku 2 ustaw zmienne `KEY`, `EC2` i `PROJECT`.

### 1. Build lokalnie (na swoim PC)

```bash
# Backend
cd backend
npm ci
npm run build

# Frontend — VITE_* muszą być ustawione przed buildem (wbijane w dist/)
cd ../frontend
npm ci
# minimum w .env lub export przed buildem:
#   VITE_BACKEND_URL=https://nest.book-store.pl/api
#   VITE_STRIPE_CONFIRMPAYMENT_URL=https://nest.book-store.pl
#   VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE=pk_test_...
npm run build
```

Build produkcyjny frontendu wymaga poprawnych `VITE_*` — po `npm run build` nie da się ich zmienić bez przebudowy.

### 2. Scp na EC2

Na serwerze muszą istnieć katalogi z **Etapu 2** (`sudo mkdir` + `chown ubuntu`). Jeśli jeszcze nie — na EC2:

```bash
sudo mkdir -p /var/www/nest-book-store/{releases,shared}
sudo chown -R ubuntu:ubuntu /var/www/nest-book-store
```

Z lokalnego PC (Git Bash / WSL). Dostosuj `KEY`, `EC2` i ścieżkę `PROJECT` do siebie:

```bash
KEY=~/.ssh/key.pem
EC2=ubuntu@PublicIPv4
PROJECT=~/nest.book-store.pl

# katalogi docelowe na serwerze
ssh -i "$KEY" "$EC2" \
  "mkdir -p /var/www/nest-book-store/releases/manual1/{backend/dist,frontend/dist}"

# backend — skompilowany dist
scp -i "$KEY" -r \
  "$PROJECT/backend/dist/"* \
  "$EC2:/var/www/nest-book-store/releases/manual1/backend/dist/"

# backend — package.json + package-lock.json (oba wymagane przez npm ci)
scp -i "$KEY" \
  "$PROJECT/backend/package.json" \
  "$PROJECT/backend/package-lock.json" \
  "$EC2:/var/www/nest-book-store/releases/manual1/backend/"

# frontend — statyczne pliki
scp -i "$KEY" -r \
  "$PROJECT/frontend/dist/"* \
  "$EC2:/var/www/nest-book-store/releases/manual1/frontend/dist/"
```

`scp` jest wbudowane przy OpenSSH (Git Bash na Windows). Nie wymaga osobnej instalacji `rsync`.

### 3. Na EC2 (SSH)

```bash
ssh -i ~/.ssh/kep.pem ubuntu@PublicIPv4

cd /var/www/nest-book-store/releases/manual1/backend
cp /var/www/nest-book-store/shared/.env.production .env

# npm ci wymaga OBU plików z kroku 2 (scp package.json + package-lock.json)
ls -la package.json package-lock.json

# na serwerze jest tylko dist/ — seed z skompilowanego JS (nie ts-node / src/)
npm ci --omit=dev
npm run seed:prod -- -i

# po seedzie na kolejne deploye wystarczy: npm ci --omit=dev

# aktywuj release (symlink current)
ln -sfn /var/www/nest-book-store/releases/manual1 /var/www/nest-book-store/current

(-s: link symboliczny (skrót, nie kopia plików), -f:nadpisz istniejący current, -n:traktuj current jako link, nie katalog (ważne z -f))

sudo systemctl restart nest-book-store
sudo systemctl status nest-book-store --no-pager
```

Kolejne deploye mogą używać `npm ci --omit=dev` (bez seeda). Seed uruchamiaj tylko **jednorazowo** na pustej bazie.

### 4. Smoke test

Z lokalnego PC lub z EC2:

```bash
curl -sS https://nest.book-store.pl/api/products | head
curl -I https://nest.book-store.pl/
```

W przeglądarce: [https://nest.book-store.pl](https://nest.book-store.pl) — katalog produktów, logowanie admina (`admin@test.pl` + `ADMIN_PASSWORD` z `.env.production`).

### Checklist przed pierwszym deployem

- [ ] Reverse proxy: **Caddy** (`deploy/Caddyfile.example`) **lub NGINX** (`deploy/nginx.md` + `nginx-nest-book-store.example`) — `root` → `.../current/frontend/dist`, proxy `/api/*` i `/socket.io/*` → `127.0.0.1:3004`
- [ ] systemd: `WorkingDirectory=/var/www/nest-book-store/current/backend`, `EnvironmentFile=.../shared/.env.production`
- [ ] `.env.production`: `DB_*`, `JWT_SECRET`, `STRIPE_*`, `ADMIN_PASSWORD`
- [ ] Frontend zbudowany z `VITE_BACKEND_URL=https://nest.book-store.pl/api`
- [ ] Stripe webhook w Dashboard: `https://nest.book-store.pl/api/webhooks/stripe`

Po udanym smoke teście przejdź do **Etapu 3** (CI) i **Etapu 4** (CD).

---

### Etap 3 — CI (GitHub Actions, bez deploy)

Workflow `.github/workflows/ci.yml`:

| Job             | Co robi                                 |
| --------------- | --------------------------------------- |
| `backend-unit`  | `npm test` + `npm run build`            |
| `frontend-unit` | `npm test` + `npm run build`            |
| `backend-e2e`   | service `postgres` + `npm run test:e2e` |

Trigger: `push` / `pull_request` na `main`.

Cypress — osobny job lub etap 3b (wolniejszy, wymaga uruchomionych serwisów).

### Etap 4 — CD (GitHub Actions)

**OVH VPS (produkcja)** — `.github/workflows/deploy-ovh.yml`:

1. Trigger: po sukcesie CI na `main` lub `workflow_dispatch`
2. Build frontendu z `OVH_DEPLOY_BASE_URL` i sekretami `VITE_*`
3. Build backendu, rsync, `activate-release.sh`, smoke test

Szczegóły bootstrapu: [ovh.md](ovh.md).

**Mail na OVH:** w `shared/.env.production` zakomentuj `ORDER_CONFIRMATION_QUEUE_URL`
(bez SQS/Lambda mail idzie przez SMTP). Szczegóły: [ovh.md — Mail po zakupie](ovh.md#mail-po-zakupie-smtp-bez-aws).

**AWS EC2 (wyłączone auto-deploy)** — `.github/workflows/deploy-ec2.yml`:

- Tylko `workflow_dispatch` (instancja zatrzymana)
- Domena: `nest.book-store.pl`, zmienna `DEPLOY_BASE_URL`

Wspólny wzorzec deployu:

1. Build frontendu z sekretami `VITE_*` (Stripe, Maps…)
2. Build backendu (`nest build`)
3. Rsync do `/var/www/nest-book-store/releases/<sha>/`
4. SSH: `activate-release.sh <sha>` → `npm ci --omit=dev` w release, symlink `current`, restart systemd
5. Smoke test: `GET /`, `GET /api/products`, opcjonalnie login admina

**GitHub Secrets (OVH):**

| Secret                                  | Opis                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `OVH_HOST`                              | hostname lub IP                                                           |
| `OVH_SSH_KEY`                           | private klucz deploy (bez passphrase) — [ovh.md](ovh.md#klucz-ssh-deploy) |
| `VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE` | build frontendu                                                           |
| `VITE_GOOGLE_MAPS_API_KEY`              | opcjonalnie                                                               |

**Variable (OVH):** `OVH_DEPLOY_BASE_URL=https://nest.book-store.com.pl`

**GitHub Secrets (EC2, ręczny deploy):**

| Secret                                  | Opis             |
| --------------------------------------- | ---------------- |
| `EC2_HOST`                              | hostname lub IP  |
| `EC2_SSH_KEY`                           | cały plik `.pem` |
| `VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE` | build frontendu  |
| `VITE_GOOGLE_MAPS_API_KEY`              | opcjonalnie      |

**Variable (EC2):** `DEPLOY_BASE_URL=https://nest.book-store.pl`

### Etap 5 — usprawnienia AWS (opcjonalnie)

| Usługa              | Zastosowanie                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Elastic IP**      | stały adres EC2                                                                                                      |
| **Lambda**          | wysyłka maila po zakupie (zamiast SMTP w Nest) — [deploy/order-confirmation-lambda.md](order-confirmation-lambda.md) |
| **S3**              | hosting `frontend/dist` + CloudFront (oddzielenie static od API) — opcjonalnie                                       |
| **Secrets Manager** | `.env.production` zamiast pliku na dysku                                                                             |
| **CloudWatch**      | logi systemd → agent                                                                                                 |
| **ALB**             | dopiero przy 2+ instancjach Nest                                                                                     |

### Etap 6 — własny VPC

1. VPC `10.0.0.0/16`
2. Public subnet `10.0.1.0/24` + Internet Gateway → EC2 z Caddy
3. Private subnet `10.0.2.0/24` → EC2 z PostgreSQL (bez public IP)
4. Security groups: app → DB tylko port 5432
5. Przeniesienie bazy na drugi EC2

### Etap 7 — Docker

**7a — Docker na nowym EC2 (strategia A — `nest.book-store.pl`):**

Nowa maszyna **tylko Docker** (bez systemd Nest / systemowego Postgresa).  
DNS: **A `nest.book-store.pl` → Elastic IP** tej EC2 (czyste przełączenie).

```text
docker compose up -d
  ├── caddy       :80/:443  (TLS, SPA, proxy)
  ├── nest-api    :3004     (sieć Compose)
  └── postgres    :5432     (volume pgdata)
```

|                                  |                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Instrukcja bootstrap             | **[deploy/docker/README.md](docker/README.md)**                                         |
| Compose / Caddyfile / Dockerfile | `deploy/docker/`                                                                        |
| CD                               | [`.github/workflows/deploy-ec2-docker.yml`](../.github/workflows/deploy-ec2-docker.yml) |
| EC2                              | **t3.small**, SG: 22 / 80 / 443                                                         |
| Variable                         | `DEPLOY_BASE_URL=https://nest.book-store.pl`                                            |

Stary workflow `deploy-ec2.yml` (systemd) zostaje jako v1 / archiwum — produkcja Docker = **`deploy-ec2-docker.yml`**.

**7b — ECR + ECS/Fargate (zaawansowane):**

- Obrazy w ECR
- RDS lub Postgres w kontenerze na EC2
- ALB przed taskami

Zacznij od **7a** na nowym EC2 ze strategią A.

### Etap 8 — NGINX jako alternatywa dla Caddy

Od początku możesz użyć NGINX zamiast Caddy — pełna instrukcja: **[nginx.md](nginx.md)**.

Pliki:

- `deploy/nginx-nest-book-store.example` → `/etc/nginx/sites-available/nest-book-store`
- `certbot --nginx -d nest.book-store.pl` zamiast automatycznego TLS w Caddy
- Mapowanie reguł: [nginx.md — Caddy ↔ NGINX](nginx.md#mapowanie-reguł-caddy--nginx)

Migracja w obie strony (Caddy ↔ NGINX) bez zmiany deployu GitHub Actions.

---

## Caddy vs NGINX vs ALB

|              | Caddy                        | NGINX                                   | ALB                      |
| ------------ | ---------------------------- | --------------------------------------- | ------------------------ |
| Kiedy        | start / mniej konfiguracji   | nauka NGINX, istniejący stack           | 2+ instancje, AWS-native |
| TLS          | automatyczny                 | certbot                                 | cert na ALB lub backend  |
| Konfiguracja | krótka (`Caddyfile.example`) | vhost (`nginx-nest-book-store.example`) | AWS Console / Terraform  |
| WebSocket    | `reverse_proxy`              | `proxy_http_version 1.1` + Upgrade      | obsługiwane              |
| Dokumentacja | `Caddyfile.example`          | [nginx.md](nginx.md)                    | —                        |
| Koszt        | 0                            | 0                                       | ~$16+/mies.              |

---

## Co **nie** jest potrzebne na start

- RDS (świadomie pomijasz — Postgres na EC2)
- ALB przy jednej instancji
- Lambda dla głównej aplikacji
- Kubernetes / ECS na początek
- Własna VPC (default wystarczy)

---

## Kolejność prac (skrót)

```
Etap 0  Przygotowanie repo + DNS
   ↓
Etap 1  EC2 + SG + Route 53 (default VPC)
   ↓
Etap 2  Bootstrap: Postgres, Caddy **lub** NGINX, systemd, .env
   ↓
Etap 3  GitHub Actions CI (testy)
   ↓
Etap 4  GitHub Actions CD (deploy na EC2)
   ↓
Etap 5  Elastic IP, Lambda mail, CloudWatch (opcjonalnie)
   ↓
Etap 6  Własna VPC + 2 EC2 (nauka)
   ↓
Etap 7  Docker Compose na **nowym** EC2 (strategia A: nest.book-store.pl)
   ↓
Etap 8  NGINX ↔ Caddy (alternatywa proxy, opcjonalnie)
```

---

## Następny krok

Masz już EC2, DNS i bootstrap — wykonaj [Pierwszy deploy ręczny](#pierwszy-deploy-ręczny), potem dodamy pliki:

- `deploy/activate-release.sh`
- `deploy/smoke-test.sh`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-ovh.yml`
- `.github/workflows/deploy-ec2.yml` (tylko ręcznie)

Pliki `deploy/Caddyfile.example`, `deploy/nginx-nest-book-store.example`, `deploy/nginx.md`, `deploy/nest-book-store.service.example` oraz **`deploy/docker/`** (Compose v2 / strategia A) są w repo.
