# Deploy OVH VPS — nest.book-store.com.pl

Produkcja na VPS OVHcloud: ten sam model co AWS EC2 (rsync + `activate-release.sh` + systemd).

Workflow: `.github/workflows/deploy-ovh.yml` (auto po CI na `main` lub ręcznie).

## DNS (OVH)

W strefie `book-store.com.pl`:

| Typ | Nazwa | Wartość        |
| --- | ----- | -------------- |
| A   | nest  | publiczny IP VPS |

## Firewall

W panelu OVH i/lub `ufw` otwórz tylko:

| Port | Usługa                          |
| ---- | ------------------------------- |
| 49152/tcp | SSH (niestandardowy port; GitHub Actions — patrz niżej) |
| 80   | HTTP (ACME / redirect → HTTPS)  |
| 443  | HTTPS (NGINX lub Caddy)         |

Porty **3004** (Nest) i **5432** (PostgreSQL) zostaw zamknięte — tylko `127.0.0.1`.

## Bootstrap serwera (jednorazowo)

Na VPS jako `ubuntu` (Ubuntu 24.04). Szczegóły Postgres, systemd i reverse proxy — jak w [deploy/README.md](README.md) Etap 2.

1. Node.js 22, git, build-essential, rsync
2. PostgreSQL — `listen_addresses = 'localhost'`, baza `bookstore` / użytkownik `bookstore`
3. Reverse proxy — **NGINX** ([nginx.md](nginx.md)) lub **Caddy** ([Caddyfile.example](Caddyfile.example))
   - `server_name nest.book-store.com.pl;` (NGINX)
   - TLS: `sudo certbot --nginx -d nest.book-store.com.pl`
4. Katalogi aplikacji:

```bash
sudo mkdir -p /var/www/nest-book-store/{releases,shared}
sudo chown -R ubuntu:ubuntu /var/www/nest-book-store
```

5. `shared/.env.production` — DB, JWT, Stripe, SMTP; **`ORDER_CONFIRMATION_QUEUE_URL` zakomentowane**
   (mail po zakupie przez SMTP, nie SQS) — patrz sekcja [Mail po zakupie](#mail-po-zakupie-smtp-bez-aws)
6. systemd — [nest-book-store.service.example](nest-book-store.service.example)
7. Sudoers: `ubuntu` może `systemctl restart nest-book-store`

## GitHub — sekrety i zmienne

**Secrets:**

| Secret                                  | Opis                    |
| --------------------------------------- | ----------------------- |
| `OVH_HOST`                              | IP lub hostname VPS     |
| `OVH_SSH_KEY`                           | **private** klucz deploy (bez passphrase) — patrz [Klucz SSH deploy](#klucz-ssh-deploy) |
| `VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE` | build frontendu         |
| `VITE_GOOGLE_MAPS_API_KEY`              | opcjonalnie             |
| `DEPLOY_ADMIN_PASSWORD`                 | opcjonalnie — smoke test |

Workflow: port **49152**, klucz **bez passphrase** (`OVH_SSH_PORT` w `deploy-ovh.yml`).

**Variables:**

| Variable               | Wartość                              |
| ---------------------- | ------------------------------------ |
| `OVH_DEPLOY_BASE_URL`  | `https://nest.book-store.com.pl`     |

## Klucz SSH deploy

Osobny par kluczy **tylko dla GitHub Actions** (bez passphrase). Osobisty klucz z passphrase
zostaje do logowania z komputera — oba publiczne klucze mogą być w `authorized_keys`.

### 1. Wygeneruj klucz deploy (lokalnie, Git Bash / WSL / Linux)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ovh_github_deploy -N "" -C "github-actions-ovh"
```

Powstaną:

| Plik | Gdzie |
| ---- | ----- |
| `~/.ssh/ovh_github_deploy` | GitHub Secret `OVH_SSH_KEY` (cały private, z nagłówkami BEGIN/END) |
| `~/.ssh/ovh_github_deploy.pub` | VPS `~/.ssh/authorized_keys` (dopisz nową linię) |

### 2. Public key na VPS

Zaloguj się **starym** kluczem (`ssh -p49152 ubuntu@IP`), potem:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys   # wklej linię z .pub (nie usuwaj starego klucza)
chmod 600 ~/.ssh/authorized_keys
```

Albo z PC (jeśli masz `ssh-copy-id`):

```bash
ssh-copy-id -i ~/.ssh/ovh_github_deploy.pub -p 49152 ubuntu@TWOJE_IP
```

### 3. Private key w GitHub

Repo → **Settings → Secrets and variables → Actions** → `OVH_SSH_KEY` = zawartość pliku
`ovh_github_deploy` (private). **Nie** commituj tego pliku do repo.

### 4. Logowanie lokalne (bez zmian)

Osobisty klucz z passphrase w `~/.ssh/config`:

```
Host ovh-nest
  HostName TWOJE_IP
  User ubuntu
  Port 49152
  IdentityFile ~/.ssh/twoj_osobisty_klucz
```

### Unieważnienie klucza deploy

Usuń odpowiadający wiersz z `authorized_keys` na VPS i wygeneruj nowy par.

## SSH dla GitHub Actions (firewall)

Runnery GitHub mają dynamiczne IP. Opcje:

- tymczasowo otworzyć **49152/tcp** z `Anywhere` (jak przy testach EC2),
- [listy IP GitHub](https://api.github.com/meta) + aktualizacja firewall,
- self-hosted runner na VPS.

## Stripe

Webhook (osobny endpoint dla domeny OVH):

```
https://nest.book-store.com.pl/api/webhooks/stripe
```

## Mail po zakupie (SMTP, bez AWS)

Na OVH **nie ma** SQS + Lambda (patrz [order-confirmation-lambda.md](order-confirmation-lambda.md) — tylko AWS).
Potwierdzenie zamówienia wysyła **NestJS bezpośrednio przez SMTP** (`MailService`).

### `ORDER_CONFIRMATION_QUEUE_URL` — zakomentuj

W `/var/www/nest-book-store/shared/.env.production` **nie ustawiaj** (albo zakomentuj):

```env
# ORDER_CONFIRMATION_QUEUE_URL=https://sqs.eu-central-1.amazonaws.com/...
```

**Dlaczego:** gdy ta zmienna jest ustawiona, `PaymentsService.notifyPurchaseReceipt()` najpierw
wywołuje `OrderConfirmationQueueService.tryEnqueue()`. Przy sukcesie **SMTP nie jest wywoływany**
(wiadomość idzie tylko do kolejki AWS). Na VPS bez Lambdy mail po płatności **nie dojdzie**,
mimo że webhook Stripe zwróci `200 OK`.

Gdy `ORDER_CONFIRMATION_QUEUE_URL` jest puste — backend używa SMTP (`SMTP_HOST`, `SMTP_USER`, …).

### `AWS_REGION`

Używane **tylko** przy wysyłce do SQS. W kodzie (`order-confirmation-queue.service.ts`) region
domyślnie to **`eu-central-1`**, jeśli `AWS_REGION` nie jest w `.env` — na OVH i tak nie ma znaczenia,
gdy kolejka jest wyłączona.

### Wymagane zmienne SMTP (OVH)

```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=store@book-store.com.pl
SMTP_PASSWORD=...
DOMAIN=book-store.com.pl
TO_3=nest@book-store.com.pl
```

Po zmianie `.env.production`:

```bash
sudo systemctl restart nest-book-store
```

Test: **nowe** zamówienie i płatność (stary webhook nie wyśle maila ponownie).

Logi:

```bash
sudo journalctl -u nest-book-store -n 100 | grep -iE 'receipt|confirmation|enqueue|mail'
```

### Uwaga: From vs SMTP_USER

`MailService` wysyła z `nest@${DOMAIN}`; konto SMTP to często `store@...`.
U niektórych providerów (np. GoDaddy) mail może trafić do spamu albo zostać odrzucony —
wtedy dopasuj adres `from` w kodzie do `SMTP_USER`.

## AWS EC2 (wyłączone)

Workflow `deploy-ec2.yml` — tylko `workflow_dispatch` (instancja zatrzymana). Domena EC2: `nest.book-store.pl`.
