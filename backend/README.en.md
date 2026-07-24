# BookStore — backend

**Language:** [Polski](README.md) | English

REST API for the online bookstore in **NestJS**. Global route prefix: **`/api`**. Default port: **3004**.

## Stack

- **NestJS 11** + **TypeScript**
- **TypeORM** + **PostgreSQL**
- **Passport JWT** — authentication
- **nestjs-i18n** — PL / EN messages (`x-app-locale`, `?language=`)
- **Stripe** — payment intent + webhook
- **Socket.IO** — order chat
- **AWS S3 / CloudFront** — image upload and signed URLs (optional)
- **Jest** — unit and e2e tests

## Requirements

- Node.js 20+
- PostgreSQL (database + user in `.env`)
- Stripe keys (test mode) — required
- `ADMIN_PASSWORD` — required for seed

## Installation

```bash
npm install
cp .env.example .env
```

Fill in at minimum:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY_TEST_MODE`, `STRIPE_WEBHOOK_SECRET_TEST_MODE`
- `ADMIN_PASSWORD` (password for `admin@test.pl` after seed)

## Running

```bash
# development (watch)
npm run start:dev

# production
npm run build
npm run start:prod
```

API: `http://localhost:3004/api`

## Data seed

Imports admin and starter products:

```bash
npm run seed -- -i
```

Removes seed data:

```bash
npm run seed -- -d
```

Production (on EC2, after `npm run build` — `dist/` only):

```bash
npm run seed:prod -- -i
# or: node dist/src/scripts/seed.js -i
```

Admin account after import:

| Field    | Value                          |
| -------- | ------------------------------ |
| Email    | `admin@test.pl`                |
| Password | `ADMIN_PASSWORD` from `.env` |

## Configuration (`.env`)

| Variable | Description | Notes |
|----------|-------------|-------|
| `PORT` | HTTP port | default `3004` |
| `DB_*` | PostgreSQL | required |
| `JWT_SECRET` | JWT token signing | required |
| `PAGINATION_LIMIT` | Product page size | default `5` |
| `TAX` | Tax rate (e.g. `0.15`) | default `0` |
| `CURRENCY` | Store currency (only `PLN`) | `GET /api/config` |
| `STRIPE_*` | Stripe keys (test) | required |
| `ADMIN_PASSWORD` | Admin password in seed | required with `-i` |
| `STORE_ADDRESS` | Store address (map) | optional |
| `CLOUDFRONT_*`, `AWS_*` | Product images | optional (admin upload) |
| `ORDER_CONFIRMATION_QUEUE_URL`, `AWS_REGION` | Post-purchase mail via SQS + Lambda (prod) | optional |
| `SMTP_*`, `DOMAIN`, `TO_*` | Post-purchase mail (local fallback) or contact form | optional |

Full list and validation: `config.schema.ts`.

## API modules (summary)

| Path | Description |
|------|-------------|
| `GET /api/config` | Store configuration (currency) |
| `GET /api/products` | Product list (public) |
| `POST /api/users/register`, `POST /api/users/login` | Auth |
| `GET /api/users/me` | Profile (JWT) |
| `POST /api/orders` | Create order (JWT) |
| `POST /api/payments/create-payment-intent` | Stripe (JWT) |
| `POST /api/payments/webhook` | Stripe webhook (raw body) |
| `GET /api/admin/*` | Admin panel (JWT + admin) |
| WebSocket | Order chat |

Protected routes use `JwtAuthGuard`; admin — additionally `AdminGuard`. Selected endpoints have rate limiting (`@SensitiveThrottle()`).

## Tests

### Unit (Jest) — no database

```bash
npm test
npm run test:watch
npm run test:cov
```

Files: `src/**/*.spec.ts` — e.g. `users.service`, `jwt.strategy`, `admin.guard`, `calc-prices`, `products.service`, `app.controller`.

### E2E (Jest + Supertest) — requires PostgreSQL

```bash
npm run test:e2e
```

File: `test/app.e2e-spec.ts` — app setup like in `main.ts` (prefix `/api`, pipes, filters).

| Test | Scope |
|------|-------|
| `GET /api/config` | store currency |
| `GET /api/products` | response structure |
| `POST /api/users/login` | invalid credentials → 401 |
| `POST /api/users/login` + `GET /api/users/me` | admin login → profile |
| `GET /api/users/me` | no token → 401 |

Requirements: `.env`, seeded database (`npm run seed -- -i`), `ADMIN_PASSWORD` matching admin password.

## Other scripts

```bash
npm run lint          # ESLint
npm run format        # Prettier
npm run chat:test     # Socket.IO connection test
npm run mail:receipt  # mail send test (receipt)
```

## `src/` structure

```
src/
├── auth/           # JWT strategy, guards
├── users/          # registration, login, profile
├── products/       # catalog, reviews, S3 upload
├── orders/         # orders, TypeORM transactions
├── payments/       # Stripe, webhook
├── reviews/        # user reviews
├── overview/       # admin statistics
├── contact/        # contact form
├── chat/           # Socket.IO
├── store-location/ # address + geocoding
├── seeder/         # import / destroy data
├── common/         # filters, mail, AWS, utils
├── app.module.ts
└── main.ts
```

## Production (summary)

Nest build generates `dist/`. Entry point is `dist/src/main.js` (alongside `config.schema.ts` in the project root, TypeScript keeps the directory structure in `dist/`).

```bash
npm run build
npm run start:prod
# or: node dist/src/main.js
```

Planned AWS deployment on **EC2** (NestJS + PostgreSQL on the instance, without RDS), secrets in Parameter Store / Secrets Manager, and existing S3 + CloudFront integration for product assets. **PostgreSQL on EC2:** [deploy/README.md — Instalacja PostgreSQL na EC2](../deploy/README.md#instalacja-postgresql-na-ec2). CI/CD and deploy details — [deploy/README.md](../deploy/README.md).

## Notes

- `synchronize: true` in TypeORM — convenient in dev; consider migrations in production.
- Stripe webhook requires `rawBody: true` (configured in `main.ts`).
- i18n: files in `src/i18n/`, `x-app-locale` header resolver.
