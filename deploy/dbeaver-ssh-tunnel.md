# DBeaver — połączenie z PostgreSQL przez tunel SSH (OVH / produkcja)

PostgreSQL na VPS nasłuchuje tylko na **`127.0.0.1:5432`** — z internetu nie połączysz się bezpośrednio.
DBeaver łączy się przez **SSH tunnel**: ruch idzie na VPS przez SSH, a stamtąd na lokalną bazę.

Domena aplikacji: **nest.book-store.com.pl** (OVH). Host SSH = **IP VPS** (z panelu OVH lub `dig nest.book-store.com.pl`).

---

## Wymagania

- DBeaver (Community wystarczy)
- **Osobisty** klucz SSH z passphrase (ten sam co do `ssh -p49152 ubuntu@IP`) — **nie** klucz deploy z GitHub Actions
- Hasło użytkownika bazy `bookstore` — z `/var/www/nest-book-store/shared/.env.production` (`DB_PASSWORD`)
- Port SSH na VPS: **49152** (nie 22)

--- ?

## Nowe połączenie w DBeaver

**Database → New Database Connection → PostgreSQL → Next**

### Zakładka **Main** (PostgreSQL)

| Pole              | Wartość                                |
| ----------------- | -------------------------------------- |
| **Host**          | `127.0.0.1` lub `localhost`            |
| **Port**          | `5432`                                 |
| **Database**      | `bookstore`                            |
| **Username**      | `bookstore`                            |
| **Password**      | hasło z `DB_PASSWORD` na serwerze      |
| **Save password** | opcjonalnie (tylko lokalnie w DBeaver) |

> **Uwaga:** Domyślna baza `postgres` jest pusta — tabele sklepu są w **`bookstore`**.

**Host/Port** wskazują **stronę serwera widzianą z VPS** (localhost po SSH), nie Twój PC.

### Zakładka **SSH**

Włącz: **Use SSH Tunnel** ✓

| Pole                      | Wartość                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Host/IP**               | publiczny IP VPS (np. z DNS `nest.book-store.com.pl`)                              |
| **Port**                  | `49152`                                                                            |
| **Username**              | `ubuntu`                                                                           |
| **Authentication method** | **Public Key**                                                                     |
| **Private key**           | ścieżka do **osobistego** klucza prywatnego, np. `C:\Users\<user>\.ssh\id_ed25519` |
| **Passphrase**            | hasło do klucza SSH (jeśli ustawione)                                              |

Alternatywa: **Save credentials in secure storage** (Windows Credential Manager).

**Local host / port** (jeśli DBeaver pokazuje): możesz zostawić domyślne albo ustawić lokalny port **`5433`**, jeśli na PC masz już PostgreSQL na `5432`.

### SSL

Produkcja (Postgres lokalnie na VPS): zwykle **SSL wyłączone** w zakładce **SSL** (Use SSL = off), o ile nie skonfigurowałeś TLS w Postgres.

---

## Test połączenia

**Test Connection** → powinno przejść (SSH + PostgreSQL).

W SQL Editor:

```sql
SELECT current_database(), current_user;
-- bookstore | bookstore

SELECT COUNT(*) FROM products;
```

---

## Równoważny tunel w terminalu (Git Bash)

Bez DBeaver — tunel w tle, potem DBeaver/psql na localhost:

```bash
ssh -p 49152 -L 5433:127.0.0.1:5432 ubuntu@TWOJE_IP_VPS
```

W drugim oknie / w DBeaver (bez zakładki SSH, tylko Main):

| Pole     | Wartość     |
| -------- | ----------- |
| Host     | `127.0.0.1` |
| Port     | `5433`      |
| Database | `bookstore` |
| Username | `bookstore` |

`-L 5433:127.0.0.1:5432` = port **5433** na Twoim PC przekierowany na **5432** Postgresa **na VPS**.

---

## Rozwiązywanie problemów

| Problem                          | Co sprawdzić                                                                |
| -------------------------------- | --------------------------------------------------------------------------- |
| SSH timeout                      | UFW / firewall OVH: port **49152** z Twojego IP; panel OVH Network Firewall |
| Auth failed (SSH)                | Zły klucz — użyj **osobistego**, nie `ovh_github_deploy`                    |
| Połączenie OK, puste tabele      | Baza **`bookstore`**, nie `postgres`                                        |
| `password authentication failed` | `DB_PASSWORD` z `.env.production` ≠ hasło w DBeaver                         |
| Port 5432 zajęty lokalnie        | W tunelu SSH użyj lokalnego portu **5433**                                  |

---

## AWS EC2 (opcjonalnie, instancja wyłączona)

Ten sam schemat; zwykle SSH port **22**, host = IP EC2, klucz `.pem` z AWS.
Szczegóły Postgres: [README.md — Instalacja PostgreSQL](README.md#instalacja-postgresql-na-ec2).

---

## Bezpieczeństwo

- Nie commituj haseł ani kluczy prywatnych do repo.
- Tunel SSH nie wymaga otwierania portu **5432** na świat — tylko **49152** (SSH) z Twojego IP.
