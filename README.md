# BookStore — nest.book-store.com.pl lub [nest.book-store.pl](http://nest.book-store.pl)

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
# Uzupełnij VITE_DEPLOY_TARGET oraz VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE_OVH / _AWS
# oraz DEPLOY_TARGET + STRIPE_*_OVH / _AWS w backend/.env
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

Szczegółowy plan etapowy (VPC, Docker, NGINX/Caddy, Lambda): [deploy/README.md](./deploy/README.md). OVH: [deploy/ovh.md](./deploy/ovh.md). NGINX: [deploy/nginx.md](./deploy/nginx.md). SQS + Lambda (AWS): [deploy/order-confirmation-lambda.md](./deploy/order-confirmation-lambda.md).

## SQS + IAM w AWS Console (EC2)

Na **AWS** Nest wrzuca mail potwierdzenia na **SQS**; Lambda go wysyła. Na **OVH** tej ścieżki nie budujesz — zakomentuj `ORDER_CONFIRMATION_QUEUE_URL` i użyj SMTP w Nest ([ovh.md](./deploy/ovh.md)).

Pełny opis: [order-confirmation-lambda.md](./deploy/order-confirmation-lambda.md). Poniżej te same **10 kroków** co w gql, pod nest i **rolę instancji EC2** (bez użytkownika IAM i bez `AWS_ACCESS_KEY_ID` — Nest nie wstawia kluczy do klienta SQS).

### Wymagania w `shared/.env.production` (EC2)

```env
ORDER_CONFIRMATION_QUEUE_URL=https://sqs.eu-central-1.amazonaws.com/TWOJE_KONTO/nest-book-store-order-confirmation
AWS_REGION=eu-central-1
TO_3=nest@book-store.com.pl
```

Kluczy `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` **nie** ustawiaj — SDK na EC2 bierze **rolę instancji**.

### Kroki w AWS Console

1. **SQS** — utwórz kolejkę (jeśli jeszcze nie ma) i skopiuj **Queue URL** (patrz [order-confirmation-lambda.md](./deploy/order-confirmation-lambda.md#krok-1--kolejka-sqs)). Type: **Standard**, name: `nest-book-store-order-confirmation`, visibility timeout **60** s.
2. **IAM** → **Policies** → **Create policy** → JSON (podmień `YOUR_ACCOUNT_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:eu-central-1:YOUR_ACCOUNT_ID:nest-book-store-order-confirmation"
    }
  ]
}
```

3. Nazwa polityki np. `nest-book-store-sqs-send-order-confirmation` → **Create policy**.
4. **IAM** → **Roles** → **Create role** (jeśli instancja nie ma roli): Trusted entity **AWS service** → **EC2** (nie Lambda). Name np. `nest-book-store-ec2-role`.
5. **Attach policies** na tej roli → `nest-book-store-sqs-send-order-confirmation` (bez `AWSLambdaSQSQueueExecutionRole`, bez AdministratorAccess).
6. **EC2** → instancja (np. `nest-book-store`) → **Actions** → **Security** → **Modify IAM role** → `nest-book-store-ec2-role`. W zakładce **Security** instancji **IAM role** nie może być `-`.
7. **Docker na EC2:** **Actions** → **Instance settings** → **Modify instance metadata options** → **Http put response hop limit** = **2** (inaczej kontener nie widzi roli → `CredentialsProviderError`).
8. Skopiuj **Queue URL** z SQS (nie access key). Secretów IAM tu nie ma.
9. Wklej URL i `AWS_REGION` do `/var/www/nest-book-store/shared/.env.production`. **Nie commituj** sekretów do repo. Nie wklejaj kluczy AWS.
10. Restart: `cd /var/www/nest-book-store/docker && docker compose up -d --force-recreate nest-api` (Docker) albo `sudo systemctl restart nest-book-store` (systemd).

### Weryfikacja

Po opłaceniu zamówienia w logach Nesta: `order confirmation email enqueued`. W CloudWatch (Lambda) — udane wywołanie po konsumpcji wiadomości z SQS.

```bash
cd /var/www/nest-book-store/docker
docker compose logs --tail 50 nest-api | grep -i enqueued
```

## Środowisko funkcji Lambda w AWS Console

Mail potwierdzenia na **AWS** to funkcja `nest-book-store-order-confirmation-email` (kod: `lambda/order-confirmation-email/`). Nest na EC2 tylko wrzuca wiadomość na SQS; **SMTP i nadawca są w env Lambdy**, nie w roli IAM. Na **OVH** tej funkcji nie konfigurujesz — mail idzie SMTP z Nesta ([ovh.md](./deploy/ovh.md)).

Pełna kolejka + IAM: [order-confirmation-lambda.md](./deploy/order-confirmation-lambda.md). Poniżej: **utworzenie funkcji, zmienne, ZIP**.

### 1. Paczka ZIP (lokalnie)

Z katalogu głównego repo (`nest.book-store.com.pl/`):

```bash
npm run lambda:package:order-email
```

Powstanie `lambda/order-confirmation-email/function.zip` (handler: `index.handler`). Na Windowsie skrypt używa PowerShell `Compress-Archive`.

### 2. Nowa funkcja (jeśli jeszcze nie istnieje)

1. AWS Console → region **eu-central-1** → **Lambda** → **Create function**.
2. **Author from scratch**.
3. Function name: `nest-book-store-order-confirmation-email`.
4. Runtime: **Node.js 20.x**, Architecture: **x86_64**.
5. Execution role: `nest-book-store-order-email-lambda-role` (polityka `AWSLambdaSQSQueueExecutionRole` — krok 5 w [order-confirmation-lambda.md](./deploy/order-confirmation-lambda.md)).
6. **Create function**.
7. **Configuration** → **General configuration** → **Edit**: timeout **30 s**, memory **256 MB**.
8. **Configuration** → **Environment variables** — tabela niżej.
9. **Add trigger** → **SQS** → kolejka `nest-book-store-order-confirmation`, batch size **1**.

### 3. Zmienne środowiskowe Lambdy

**Configuration** → **Environment variables** → **Edit**. To nie jest `backend/.env` ani `shared/.env.production` na EC2.

Odczyt później: ta sama ścieżka (**Configuration** → **Environment variables**). Hasła widać po edycji — nie wklejaj ich do czatu.

**SMTP (wymagane):** te same wartości co działały na serwerze przy mailu kontaktowym / zakupie.

| Klucz           | Przykład                          | Uwaga    |
| --------------- | --------------------------------- | -------- |
| `SMTP_HOST`     | host SMTP                         | wymagane |
| `SMTP_PORT`     | `465` lub `587`                   |          |
| `SMTP_USER`     | login SMTP                        | wymagane |
| `SMTP_PASSWORD` | hasło SMTP                        | wymagane |
| `SMTP_SECURE`   | `true` przy 465, `false` przy 587 |          |

**Nadawca** — wystarczy **jeden** wariant:

| Wariant       | Klucze                              | Wynik `From`                                                    |
| ------------- | ----------------------------------- | --------------------------------------------------------------- |
| A             | `EMAIL_FROM=nest@book-store.com.pl` | ten adres; `DOMAIN` / `MAIL_FROM_LOCAL` są ignorowane           |
| B (składanie) | `DOMAIN=book-store.com.pl`          | `nest@book-store.com.pl` (domyślne `MAIL_FROM_LOCAL` to `nest`) |

Przy wariancie B możesz ustawić `MAIL_FROM_LOCAL` jawnie na `nest`. Bez `EMAIL_FROM` i bez `DOMAIN` handler rzuci `Missing EMAIL_FROM or DOMAIN`.

**Opcjonalnie:** `CURRENCY=PLN`, `STORE_NAME=BookStore` (nagłówek `"BookStore" <adres>`).

**Nie ustawiaj na Lambdzie:** `ORDER_CONFIRMATION_QUEUE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `TO_3`. URL kolejki i `TO_3` są na **EC2** (`shared/.env.production`). Nest w tym projekcie nie czyta kluczy IAM do SQS — na EC2 działa rola instancji.

Zmiana samego hasła SMTP: edycja env w konsoli, **bez** ponownego ZIP-a.

### 4. Wgranie (lub aktualizacja) kodu

1. Otwórz funkcję **nest-book-store-order-confirmation-email**.
2. Zakładka **Code**.
3. **Upload from** → **.zip file** → `lambda/order-confirmation-email/function.zip` → **Save**.
4. **Runtime settings** → **Handler:** `index.handler`.
5. **Deploy**, jeśli konsola o to poprosi.

Upload **zastępuje cały pakiet** funkcji. Env, rola i trigger SQS zostają.

### 5. Test w konsoli

**Test** → nowe zdarzenie → wklej `lambda/order-confirmation-email/test-event.json` (obiekt z `"Records"`). Zmień `you@example.com` na swój adres — test **wysyła** mail. Szablon Hello World nie zadziała (`No SQS records in event`).

## Stack (skrót)

| Warstwa  | Technologie                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| Backend  | NestJS 11, TypeORM, PostgreSQL, Passport JWT, Stripe, Socket.IO, i18n         |
| Frontend | React 19, Vite, TanStack Query, Redux Toolkit, Tailwind 4, shadcn/ui, Cypress |
