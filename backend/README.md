# BookStore — backend

**Język:** Polski | [English](README.en.md)

REST API sklepu internetowego w **NestJS**. Globalny prefix tras: **`/api`**. Domyślny port: **3004**.

## Stack

- **NestJS 11** + **TypeScript**
- **TypeORM** + **PostgreSQL**
- **Passport JWT** — autoryzacja
- **nestjs-i18n** — komunikaty PL / EN (`x-app-locale`, `?language=`)
- **Stripe** — payment intent + webhook
- **Socket.IO** — czat przy zamówieniu
- **AWS S3 / CloudFront** — upload i podpisywane URL-e obrazów (opcjonalnie)
- **Jest** — testy unit i e2e

## Wymagania

- Node.js 20+
- PostgreSQL (baza + użytkownik w `.env`)
- Klucze Stripe (test mode) — wymagane
- `ADMIN_PASSWORD` — wymagane do seeda

## Instalacja

```bash
npm install
cp .env.example .env
```

Uzupełnij minimum:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `DEPLOY_TARGET` (`ovh` | `aws`), `STRIPE_SECRET_KEY_TEST_MODE_OVH` / `_AWS`, `STRIPE_WEBHOOK_SECRET_TEST_MODE_OVH` / `_AWS` (wymagana para dla aktywnego targetu)
- `ADMIN_PASSWORD` (hasło konta `admin@test.pl` po seedzie)

## Uruchomienie

```bash
# development (watch)
npm run start:dev

# production
npm run build
npm run start:prod
```

API: `http://localhost:3004/api`

## Seed danych

Importuje admina i produkty startowe:

```bash
npm run seed -- -i
```

Usuwa dane seeda:

```bash
npm run seed -- -d
```

Produkcja (na EC2, po `npm run build` — tylko `dist/`):

```bash
npm run seed:prod -- -i
# lub: node dist/src/scripts/seed.js -i
```

Konto admina po imporcie:

| Pole | Wartość |
|------|---------|
| E-mail | `admin@test.pl` |
| Hasło | `ADMIN_PASSWORD` z `.env` |

## Konfiguracja (`.env`)

| Zmienna | Opis | Uwagi |
|---------|------|--------|
| `PORT` | Port HTTP | domyślnie `3004` |
| `DB_*` | PostgreSQL | wymagane |
| `JWT_SECRET` | Podpis tokenów JWT | wymagane, min. 32 znaki (nie placeholder z `.env.example`) |
| `PAGINATION_LIMIT` | Rozmiar strony produktów | domyślnie `5` |
| `TAX` | Stawka podatku (np. `0.15`) | domyślnie `0` |
| `CURRENCY` | Waluta sklepu (tylko `PLN`) | `GET /api/config` |
| `STRIPE_*` | Klucze Stripe (test) | wymagane |
| `ADMIN_PASSWORD` | Hasło admina w seedzie | wymagane przy `-i` |
| `STORE_ADDRESS` | Adres sklepu (mapa) | opcjonalne |
| `CLOUDFRONT_*`, `AWS_*` | Obrazy produktów | opcjonalne (admin upload) |
| `ORDER_CONFIRMATION_QUEUE_URL`, `AWS_REGION` | Mail po zakupie via SQS + Lambda (prod) | opcjonalne |
| `SMTP_*`, `DOMAIN`, `TO_*` | Mail po zakupie (fallback lokalny) lub formularz kontaktowy | opcjonalne |

Pełna lista i walidacja: `config.schema.ts`.

## Moduły API (skrót)

| Ścieżka | Opis |
|---------|------|
| `GET /api/config` | Konfiguracja sklepu (waluta) |
| `GET /api/products` | Lista produktów (publiczne) |
| `POST /api/users/register`, `POST /api/users/login` | Auth |
| `GET /api/users/me` | Profil (JWT) |
| `POST /api/orders` | Tworzenie zamówienia (JWT) |
| `POST /api/payments/create-payment-intent` | Stripe (JWT) |
| `POST /api/payments/webhook` | Webhook Stripe (raw body) |
| `GET /api/admin/*` | Panel admina (JWT + admin) |
| WebSocket | Czat przy zamówieniu |

Chronione trasy używają `JwtAuthGuard`; admin — dodatkowo `AdminGuard`. Wybrane endpointy mają rate limit (`@SensitiveThrottle()`).

## Testy

### Unit (Jest) — bez bazy

```bash
npm test
npm run test:watch
npm run test:cov
```

Pliki: `src/**/*.spec.ts` — m.in. `users.service`, `jwt.strategy`, `admin.guard`, `calc-prices`, `products.service`, `app.controller`.

### E2E (Jest + Supertest) — wymaga PostgreSQL

```bash
npm run test:e2e
```

Plik: `test/app.e2e-spec.ts` — konfiguracja aplikacji jak w `main.ts` (prefix `/api`, pipe'y, filtry).

| Test | Zakres |
|------|--------|
| `GET /api/config` | waluta sklepu |
| `GET /api/products` | struktura odpowiedzi |
| `POST /api/users/login` | błędne dane → 401 |
| `POST /api/users/login` + `GET /api/users/me` | logowanie admina → profil |
| `GET /api/users/me` | brak tokena → 401 |

Wymagania: `.env`, zaseedowana baza (`npm run seed -- -i`), `ADMIN_PASSWORD` zgodne z hasłem admina.

## Inne skrypty

```bash
npm run lint          # ESLint
npm run format        # Prettier
npm run chat:test     # test połączenia Socket.IO
npm run mail:receipt  # test wysyłki maila (receipt)
```

## Struktura `src/`

```
src/
├── auth/           # JWT strategy, guardy
├── users/          # rejestracja, logowanie, profil
├── products/       # katalog, recenzje, upload S3
├── orders/         # zamówienia, transakcje TypeORM
├── payments/       # Stripe, webhook
├── reviews/        # recenzje użytkownika
├── overview/       # statystyki admina
├── contact/        # formularz kontaktowy
├── chat/           # Socket.IO
├── store-location/ # adres + geokodowanie
├── seeder/         # import / destroy danych
├── common/         # filtry, mail, AWS, utils
├── app.module.ts
└── main.ts
```

## Produkcja (skrót)

Build Nest generuje `dist/`. Punkt wejścia to `dist/src/main.js` (obok `config.schema.ts` w root projektu TypeScript zachowuje strukturę katalogów w `dist/`).

```bash
npm run build
npm run start:prod
# lub: node dist/src/main.js
```

Na AWS planowane jest wdrożenie na **EC2** (NestJS + PostgreSQL zainstalowany bezpośrednio na instancji, bez RDS), z sekretami w Parameter Store / Secrets Manager oraz istniejącą integracją S3 + CloudFront dla assetów produktów. **Instalacja PostgreSQL na EC2:** [deploy/README.md — Instalacja PostgreSQL na EC2](../deploy/README.md#instalacja-postgresql-na-ec2). Szczegóły CI/CD i deploy — [deploy/README.md](../deploy/README.md).

## Uwagi

- `synchronize: true` w TypeORM — wygodne w dev; na produkcji rozważ migracje.
- Webhook Stripe wymaga `rawBody: true` (skonfigurowane w `main.ts`).
- i18n: pliki w `src/i18n/`, resolver nagłówka `x-app-locale`.
