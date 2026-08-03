# BookStore — nest.book-store.com.pl lub nest.book-store.pl

**Język:** Polski | [English](README.en.md)

Full-stackowy sklep z książkami (monorepo): **React 19** + **Vite** (**Tailwind CSS v4**, **shadcn/ui**, **TanStack Query**, **Redux Toolkit**, **React Router v7**) oraz REST API **NestJS** (**TypeORM**, **PostgreSQL**, **JWT**). **Stripe**, chat **Socket.IO**, **AWS S3** + **CloudFront**; opcjonalny mail potwierdzenia zamówienia przez **AWS SQS** + **Lambda**. Testy: **Jest**, **Supertest**, **Vitest**, **Cypress**. CI/CD: **GitHub Actions**. Deploy na **AWS EC2** i/lub **OVH VPS**.

## Struktura repozytorium

```
nest.book-store.com.pl/
├── backend/     # NestJS + PostgreSQL + TypeORM
└── frontend/    # React 19 + Vite + TanStack Query + Redux
```

Szczegóły per warstwa:

- [backend/README.md](./backend/README.md) ([English](./backend/README.en.md)) — API, baza, seed, testy backendu
- [frontend/README.md](./frontend/README.md) ([English](./frontend/README.en.md)) — UI, Cypress, konfiguracja Vite

## Wymagania

- **Node.js** 20+
- **PostgreSQL** 14+
- Konta / klucze (dev): **Stripe** (test mode), opcjonalnie **Google Maps**, **AWS** (S3 + CloudFront — upload obrazów admina)

## Szybki start (lokalnie)

### 1. Baza danych

Utwórz bazę PostgreSQL, np. `bookstore`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Uzupełnij DB_*, JWT_SECRET, STRIPE_*, ADMIN_PASSWORD
npm run seed -- -i
npm run start:dev
```

API: [http://localhost:3004/api](http://localhost:3004/api) (domyślny port z `config.schema.ts`)

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Uzupełnij VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE
npm run dev
```

Aplikacja: [http://localhost:5173](http://localhost:5173)

### Konto testowe (po seedzie)

| Pole   | Wartość                                    |
| ------ | ------------------------------------------ |
| E-mail | `admin@test.pl`                            |
| Hasło  | wartość `ADMIN_PASSWORD` z `.env` backendu |

## Testy

Uruchamiaj z odpowiednich katalogów. Backend e2e i Cypress wymagają działającej bazy z seedem.

```bash
# Backend — unit (bez bazy)
cd backend && npm test

# Backend — e2e (PostgreSQL + .env + seed)
cd backend && npm run test:e2e

# Frontend — unit
cd frontend && npm test

# Frontend — E2E (backend :3004 + frontend :5173)
cd frontend && npm run cy:run
```

| Warstwa       | Narzędzie        | Liczba  | Wymaga bazy     |
| ------------- | ---------------- | ------- | --------------- |
| Backend unit  | Jest             | 14      | nie             |
| Backend e2e   | Jest + Supertest | 5       | tak             |
| Frontend unit | Vitest           | 3 pliki | nie             |
| Frontend E2E  | Cypress          | 20      | tak (+ serwery) |

## Główne funkcje

- Rejestracja / logowanie (JWT), profil użytkownika
- Katalog produktów z filtrami, wyszukiwarką, recenzjami
- Koszyk, checkout, płatność Stripe
- Zamówienia użytkownika, czat Socket.IO przy zamówieniu
- Panel administratora (produkty, zamówienia, użytkownicy, recenzje)
- i18n (nagłówek `x-app-locale`), waluta z `GET /api/config`
- Mapa sklepu (Google Maps), formularz kontaktowy

## Planowane kroki

1. **CI** — GitHub Actions: `npm test` + `npm run build` (backend i frontend), potem backend e2e, na końcu Cypress
2. **Deployment** — produkcja na **OVH VPS** (`nest.book-store.com.pl`): [deploy/ovh.md](./deploy/ovh.md). AWS EC2 (`nest.book-store.pl`) — deploy ręczny, gdy instancja włączona: [deploy/README.md](./deploy/README.md)

Szczegółowy plan etapowy (VPC, Docker, NGINX/Caddy, Lambda): [deploy/README.md](./deploy/README.md). OVH: [deploy/ovh.md](./deploy/ovh.md). NGINX: [deploy/nginx.md](./deploy/nginx.md).

## Stack (skrót)

| Warstwa  | Technologie                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| Backend  | NestJS 11, TypeORM, PostgreSQL, Passport JWT, Stripe, Socket.IO, i18n         |
| Frontend | React 19, Vite, TanStack Query, Redux Toolkit, Tailwind 4, shadcn/ui, Cypress |
