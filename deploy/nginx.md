# NGINX — reverse proxy (alternatywa dla Caddy)

Ta sama topologia co w [README.md](README.md): jeden EC2, Nest na `127.0.0.1:3004`, frontend z `current/frontend/dist`.

|                         | Caddy                                  | NGINX                                                          |
| ----------------------- | -------------------------------------- | -------------------------------------------------------------- |
| TLS                     | automatyczny (wbudowany ACME)          | **certbot** + Let's Encrypt                                    |
| Plik przykładu          | [Caddyfile.example](Caddyfile.example) | [nginx-nest-book-store.example](nginx-nest-book-store.example) |
| WebSocket `/socket.io/` | `reverse_proxy`                        | `proxy_set_header Upgrade` + `Connection`                      |
| Deploy aplikacji        | bez zmian (GitHub Actions → EC2)       | bez zmian                                                      |

**Nie instaluj obu naraz** na produkcji — wybierz jeden reverse proxy na porcie 80/443.

---

## Kiedy NGINX zamiast Caddy

- Chcesz uczyć się NGINX / certbot (częsty stack w firmach)
- Masz już NGINX na serwerze
- Potrzebujesz drobnych reguł proxy niedostępnych w Caddy

**Caddy** nadal jest rekomendowany na start (mniej kroków, auto-TLS).

---

## Etap 2 — bootstrap z NGINX (świeży serwer)

Na EC2 jako `ubuntu` (po Node, Postgres — patrz README):

### 1. Instalacja

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
```

### 2. Katalogi aplikacji

(jeśli jeszcze nie ma — z README Etap 2)

```bash
sudo mkdir -p /var/www/nest-book-store/{releases,shared}
sudo mkdir -p /var/www/certbot
sudo chown -R ubuntu:ubuntu /var/www/nest-book-store
```

### 3. Konfiguracja vhost

```bash
sudo cp /path/to/repo/deploy/nginx-nest-book-store.example \
  /etc/nginx/sites-available/nest-book-store
```

Dostosuj `server_name` jeśli inna domena.

```bash
sudo ln -sfn /etc/nginx/sites-available/nest-book-store \
  /etc/nginx/sites-enabled/nest-book-store
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4. TLS (certbot)

DNS musi wskazywać na EC2 (rekord A w Route 53). Security Group: porty **80** i **443** otwarte.

```bash
sudo certbot --nginx -d nest.book-store.pl
```

Certbot dopisze certyfikaty i zwykle przekierowanie HTTP → HTTPS.

Odnowienie (cron jest instalowany z certbotem):

```bash
sudo certbot renew --dry-run
```

### 5. systemd Nest + reszta bootstrapu

Bez zmian: [nest-book-store.service.example](nest-book-store.service.example), `shared/.env.production`, `activate-release.sh` — patrz README Etap 2.

---

## Migracja z Caddy → NGINX (istniejący serwer)

1. Skopiuj i włącz vhost (kroki 3 powyżej)
2. Sprawdź konfigurację: `sudo nginx -t`
3. Zatrzymaj Caddy (żeby zwolnić 80/443):

```bash
sudo systemctl stop caddy
sudo systemctl disable caddy
```

4. Uruchom NGINX:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

5. Certbot (jeśli jeszcze nie ma certów dla NGINX):

```bash
sudo certbot --nginx -d nest.book-store.pl
```

6. Smoke test:

```bash
curl -sS https://nest.book-store.pl/api/products | head
curl -I https://nest.book-store.pl/
```

Caddy możesz zostawić zainstalowany (`disabled`) albo odinstalować później.

---

## Migracja z NGINX → Caddy

1. Zatrzymaj NGINX: `sudo systemctl stop nginx && sudo systemctl disable nginx`
2. Wgraj [Caddyfile.example](Caddyfile.example) → `/etc/caddy/Caddyfile`
3. `sudo systemctl enable --now caddy`
4. Smoke test jak wyżej

---

## Mapowanie reguł (Caddy ↔ NGINX)

| Ścieżka        | Caddy                                | NGINX                                                 |
| -------------- | ------------------------------------ | ----------------------------------------------------- |
| `/api/*`       | `reverse_proxy 127.0.0.1:3004`       | `location /api/` → `proxy_pass http://127.0.0.1:3004` |
| `/socket.io/*` | `reverse_proxy`                      | `location /socket.io/` + nagłówki Upgrade             |
| `/` (SPA)      | `root` + `try_files` + `file_server` | `root` + `try_files $uri $uri/ /index.html`           |
| Kompresja      | `encode gzip`                        | `gzip on` + `gzip_types`                              |

Stripe webhook: `https://nest.book-store.pl/api/webhooks/stripe` — bez zmian.

---

## Deploy (GitHub Actions)

Workflow [deploy-ec2.yml](../.github/workflows/deploy-ec2.yml) **nie restartuje** Caddy ani NGINX — wystarczy symlink `current` (frontend w nowym release).

Po deployu:

- **Caddy** — zwykle nie trzeba restartu (odczytuje pliki z dysku)
- **NGINX** — też nie, o ile `root` wskazuje na `.../current/frontend/dist`

Restart proxy tylko po zmianie **konfiguracji** vhosta:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Rozwiązywanie problemów

| Objaw                       | Sprawdź                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `/api/*` zwraca HTML        | Kolejność `location` — `/api/` musi być przed `location /`   |
| WebSocket / czat nie działa | Blok `/socket.io/` + `Upgrade` / `Connection`                |
| 502 Bad Gateway             | `systemctl status nest-book-store`, port `3004` na localhost |
| Certbot failed              | DNS, port 80 z internetu, `server_name` zgodny z domeną      |

Logi:

```bash
sudo tail -f /var/log/nginx/error.log
journalctl -u nest-book-store -f
```
