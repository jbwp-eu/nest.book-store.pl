# BookStore — frontend

**Język:** Polski | [English](README.en.md)

Aplikacja kliencka sklepu internetowego (księgarnia). Komunikuje się z backendem NestJS pod adresem `http://localhost:3004/api` (dev) lub `https://nest.book-store.pl/api` (produkcja).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** — routing
- **TanStack Query** — dane z API (cache, mutacje)
- **Redux Toolkit** — stan UI (język, motyw, koszyk, auth)
- **react-hook-form** + **Zod** — formularze
- **i18next** — tłumaczenia PL / EN
- **Tailwind CSS 4** + **shadcn/ui**
- **Stripe** — płatności kartą
- **Socket.IO** — czat przy zamówieniu
- **Vitest** — testy jednostkowe
- **Cypress** — testy E2E

## Wymagania

- Node.js 20+
- Działający backend Nest (`../backend`) z PostgreSQL i seedem danych
- Plik `.env` (skopiuj z `.env.example`)

## Instalacja

```bash
npm install
cp .env.example .env
```

Uzupełnij w `.env` klucz Stripe (`VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE`) oraz opcjonalnie klucze Google Maps.

## Uruchomienie

Backend musi działać na porcie **3004** (globalny prefix `/api`).

```bash
# terminal 1 — backend
cd ../backend
npm run start:dev

# terminal 2 — frontend
npm run dev
```

Aplikacja: [http://localhost:5173](http://localhost:5173)

Inne komendy:

```bash
npm run build      # produkcyjny build (tsc + vite)
npm run preview    # podgląd buildu
npm run lint       # ESLint
```

## Konfiguracja środowiska

| Zmienna                                 | Opis                               | Domyślnie                   |
| --------------------------------------- | ---------------------------------- | --------------------------- |
| `VITE_PORT`                             | Port dev servera                   | `5173`                      |
| `VITE_BACKEND_URL`                      | URL API Nest                       | `http://localhost:3004/api` |
| `VITE_ASSET_URL`                        | CloudFront — obrazy produktów      | CloudFront demo             |
| `VITE_LANGUAGE`                         | Domyślny język UI (`pl` / `en`)    | `pl`                        |
| `VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE` | Klucz publiczny Stripe (test)      | —                           |
| `VITE_STRIPE_CONFIRMPAYMENT_URL`        | Origin powrotu po płatności Stripe | `http://localhost:5173`     |
## Testy

### Vitest (jednostkowe)

```bash
npm test
npm run test:watch
```

Pliki testów: `src/**/*.test.{ts,tsx}` (m.in. `shipping.test.ts`, `products.test.tsx`, `storeLocation.test.tsx`).

### Cypress (E2E)

Wymaga **uruchomionego backendu i frontendu** (`npm run dev` na porcie 5173) oraz `ADMIN_PASSWORD` w `backend/.env` (Cypress wczytuje je automatycznie).

```bash
npm run cy:run    # headless
npm run cy:open   # interaktywny runner
```

| Plik                           | Zakres                                          |
| ------------------------------ | ----------------------------------------------- |
| `cypress/e2e/auth.cy.ts`       | logowanie, rejestracja (regulamin), wylogowanie |
| `cypress/e2e/cart.cy.ts`       | koszyk                                          |
| `cypress/e2e/checkout.cy.ts`   | powrót ze Stripe (`/order/:id/payment-success`) |
| `cypress/e2e/navigation.cy.ts` | nawigacja, trasy chronione                      |
| `cypress/e2e/products.cy.ts`   | katalog i szczegóły produktu                    |

Dane logowania testowego: e-mail `admin@test.pl` w `cypress/fixtures/users.example.json`; hasło z `ADMIN_PASSWORD` w `backend/.env`.

## Struktura `src/`

```
src/
├── api/              # wywołania REST do backendu
├── components/       # UI (layout, produkty, checkout, admin…)
├── hooks/            # hooki React (np. useAuth)
├── i18n/             # tłumaczenia pl.ts, en.ts
├── lib/              # apiClient, env, auth, formatowanie
├── pages/            # strony routingu
├── providers/        # AppProviders (Redux, Query, i18n, waluta)
├── store/            # Redux slices
├── router.tsx        # definicja tras
└── main.tsx          # punkt wejścia
```

## Główne trasy

| Ścieżka                                             | Dostęp                                        |
| --------------------------------------------------- | --------------------------------------------- |
| `/`, `/product/:id`, `/cart`, `/contact`, `/terms`  | publiczne                                     |
| `/login`, `/register`                               | publiczne                                     |
| `/profile`, `/my-orders`, `/checkout`, `/order/:id` | zalogowany                                    |
| `/order/:id/payment-success`                        | zalogowany (workaround po redirectzie Stripe) |
| `/admin/*`                                          | administrator                                 |

## Uwagi developerskie

- Nagłówek `x-app-locale` (`pl` / `en`) jest wysyłany do API przy każdym żądaniu.
- Token JWT i `userInfo` są trzymane w `localStorage`.
- Obrazy produktów: `VITE_ASSET_URL` + ścieżka z API.
