# BookStore — frontend

**Language:** [Polski](README.md) | English

Client application for the online bookstore. Talks to the NestJS backend at `http://localhost:3004/api` (dev) or `https://nest.book-store.pl/api` (production).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** — routing
- **TanStack Query** — API data (cache, mutations)
- **Redux Toolkit** — UI state (language, theme, cart, auth)
- **react-hook-form** + **Zod** — forms
- **i18next** — PL / EN translations
- **Tailwind CSS 4** + **shadcn/ui**
- **Stripe** — card payments
- **Socket.IO** — order chat
- **Vitest** — unit tests
- **Cypress** — E2E tests

## Requirements

- Node.js 20+
- Running Nest backend (`../backend`) with PostgreSQL and seeded data
- `.env` file (copy from `.env.example`)

## Installation

```bash
npm install
cp .env.example .env
```

Fill in the Stripe key (`VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE`) and optionally Google Maps keys in `.env`.

## Running

The backend must run on port **3004** (global prefix `/api`).

```bash
# terminal 1 — backend
cd ../backend
npm run start:dev

# terminal 2 — frontend
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Other commands:

```bash
npm run build      # production build (tsc + vite)
npm run preview    # preview build
npm run lint       # ESLint
```

## Environment configuration

| Variable                                | Description                        | Default                     |
| --------------------------------------- | ---------------------------------- | --------------------------- |
| `VITE_PORT`                             | Dev server port                    | `5173`                      |
| `VITE_BACKEND_URL`                      | Nest API URL                       | `http://localhost:3004/api` |
| `VITE_ASSET_URL`                        | CloudFront — product images        | demo CloudFront             |
| `VITE_LANGUAGE`                         | Default UI language (`pl` / `en`)  | `pl`                        |
| `VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE` | Stripe publishable key (test)      | —                           |
| `VITE_STRIPE_CONFIRMPAYMENT_URL`        | Origin after Stripe payment return | `http://localhost:5173`     |

## Tests

### Vitest (unit)

```bash
npm test
npm run test:watch
```

Test files: `src/**/*.test.{ts,tsx}` (e.g. `shipping.test.ts`, `products.test.tsx`, `storeLocation.test.tsx`).

### Cypress (E2E)

Requires **running backend and frontend** (`npm run dev` on port 5173) and `ADMIN_PASSWORD` in `backend/.env` (Cypress loads it automatically).

```bash
npm run cy:run    # headless
npm run cy:open   # interactive runner
```

| File                           | Scope                                           |
| ------------------------------ | ----------------------------------------------- |
| `cypress/e2e/auth.cy.ts`       | login, registration (terms), logout             |
| `cypress/e2e/cart.cy.ts`       | cart                                            |
| `cypress/e2e/checkout.cy.ts`   | return from Stripe (`/order/:id/payment-success`) |
| `cypress/e2e/navigation.cy.ts` | navigation, protected routes                    |
| `cypress/e2e/products.cy.ts`   | catalog and product details                     |

Test login: email `admin@test.pl` in `cypress/fixtures/users.example.json`; password from `ADMIN_PASSWORD` in `backend/.env`.

## `src/` structure

```
src/
├── api/              # REST calls to backend
├── components/       # UI (layout, products, checkout, admin…)
├── hooks/            # React hooks (e.g. useAuth)
├── i18n/             # translations pl.ts, en.ts
├── lib/              # apiClient, env, auth, formatting
├── pages/            # routing pages
├── providers/        # AppProviders (Redux, Query, i18n, currency)
├── store/            # Redux slices
├── router.tsx        # route definitions
└── main.tsx          # entry point
```

## Main routes

| Path                                                | Access                                        |
| --------------------------------------------------- | --------------------------------------------- |
| `/`, `/product/:id`, `/cart`, `/contact`, `/terms`  | public                                        |
| `/login`, `/register`                               | public                                        |
| `/profile`, `/my-orders`, `/checkout`, `/order/:id` | authenticated                                 |
| `/order/:id/payment-success`                        | authenticated (workaround after Stripe redirect) |
| `/admin/*`                                          | administrator                                 |

## Developer notes

- The `x-app-locale` header (`pl` / `en`) is sent to the API with every request.
- JWT token and `userInfo` are stored in `localStorage`.
- Product images: `VITE_ASSET_URL` + path from API.
