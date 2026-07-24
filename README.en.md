# BookStore — nest.book-store.com.pl or nest.book-store.pl

**Language:** [Polski](README.md) | English

Online bookstore: **NestJS** (REST API) + **React** (SPA). Full flow — catalog, cart, orders, Stripe, admin panel, i18n PL/EN.

## Repository structure

```
nest.book-store.com.pl/
├── backend/     # NestJS + PostgreSQL + TypeORM
└── frontend/    # React 19 + Vite + TanStack Query + Redux
```

Details per layer:

- [backend/README.en.md](./backend/README.en.md) — API, database, seed, backend tests
- [frontend/README.en.md](./frontend/README.en.md) — UI, Cypress, Vite configuration

## Requirements

- **Node.js** 20+
- **PostgreSQL** 14+
- Accounts / keys (dev): **Stripe** (test mode), optionally **Google Maps**, **AWS** (S3 + CloudFront — admin image uploads)

## Quick start (local)

### 1. Database

Create a PostgreSQL database, e.g. `bookstore`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in DB_*, JWT_SECRET, STRIPE_*, ADMIN_PASSWORD
npm run seed -- -i
npm run start:dev
```

API: [http://localhost:3004/api](http://localhost:3004/api) (default port from `config.schema.ts`)

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### Test account (after seed)

| Field    | Value                                          |
| -------- | ---------------------------------------------- |
| Email    | `admin@test.pl`                                |
| Password | `ADMIN_PASSWORD` value from the backend `.env` |

## Tests

Run from the appropriate directories. Backend e2e and Cypress need a running database with seed data.

```bash
# Backend — unit (no database)
cd backend && npm test

# Backend — e2e (PostgreSQL + .env + seed)
cd backend && npm run test:e2e

# Frontend — unit
cd frontend && npm test

# Frontend — E2E (backend :3004 + frontend :5173)
cd frontend && npm run cy:run
```

| Layer         | Tool             | Count   | Needs database  |
| ------------- | ---------------- | ------- | --------------- |
| Backend unit  | Jest             | 14      | no              |
| Backend e2e   | Jest + Supertest | 5       | yes             |
| Frontend unit | Vitest           | 3 files | no              |
| Frontend E2E  | Cypress          | 20      | yes (+ servers) |

## Main features

- Registration / login (JWT), user profile
- Product catalog with filters, search, reviews
- Cart, checkout, Stripe payment
- User orders, Socket.IO chat on an order
- Admin panel (products, orders, users, reviews)
- i18n (`x-app-locale` header), currency from `GET /api/config`
- Store map (Google Maps), contact form

## Planned next steps

1. **CI** — GitHub Actions: `npm test` + `npm run build` (backend and frontend), then backend e2e, finally Cypress
2. **Deployment** — production on **OVH VPS** (`nest.book-store.com.pl`): [deploy/ovh.md](./deploy/ovh.md). AWS EC2 (`nest.book-store.pl`) — manual deploy when the instance is running: [deploy/README.md](./deploy/README.md)

Detailed staged plan (VPC, Docker, NGINX/Caddy, Lambda): [deploy/README.md](./deploy/README.md). OVH: [deploy/ovh.md](./deploy/ovh.md). NGINX: [deploy/nginx.md](./deploy/nginx.md).

## Stack (summary)

| Layer    | Technologies                                                                  |
| -------- | ----------------------------------------------------------------------------- |
| Backend  | NestJS 11, TypeORM, PostgreSQL, Passport JWT, Stripe, Socket.IO, i18n         |
| Frontend | React 19, Vite, TanStack Query, Redux Toolkit, Tailwind 4, shadcn/ui, Cypress |
