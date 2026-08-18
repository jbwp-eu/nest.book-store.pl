# Mail potwierdzenia zamówienia (SQS + Lambda + SMTP) — AWS

Po opłaceniu zamówienia (webhook Stripe) Nest na EC2 wrzuca wiadomość na **SQS**; **Lambda** wysyła mail przez SMTP.

Region: **eu-central-1** (jak EC2).  
Sekrety SMTP trzymasz w **env Lambdy**, nie w kodzie.  
EC2 nie potrzebuje access key — używa **roli IAM** instancji (`sqs:SendMessage`).

**OVH:** nie używaj kolejki — w `shared/.env.production` zakomentuj `ORDER_CONFIRMATION_QUEUE_URL` (mail SMTP bezpośrednio z Nest). Zob. [ovh.md](ovh.md#mail-po-zakupie-smtp-bez-aws).

---

## Przegląd (ARN)

**ARN** (*Amazon Resource Name*) — unikalny identyfikator zasobu AWS, np. kolejki:

```text
arn:aws:sqs:eu-central-1:ACCOUNT_ID:nest-book-store-order-confirmation
```

W polityce IAM w polu `Resource` wklejasz ARN z konsoli SQS (Details).

---

## Krok 1 — Kolejka SQS

1. AWS Console → **SQS** → **Create queue**
2. Type: **Standard**
3. Name: `nest-book-store-order-confirmation`
4. Visibility timeout: **60** sekund
5. Create → skopiuj:
   - **Queue URL** → później `ORDER_CONFIRMATION_QUEUE_URL` na EC2  
   - **ARN** → do polityki IAM

---

## Krok 2 — Polityka IAM (EC2 → SQS)

Umożliwia Nestowi na EC2 wysłanie wiadomości na kolejkę.

1. **IAM** → **Policies** → **Create policy** → zakładka **JSON**
2. Wklej (podstaw `ACCOUNT_ID` / ARN z kroku 1):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:eu-central-1:ACCOUNT_ID:nest-book-store-order-confirmation"
    }
  ]
}
```

3. Name: `nest-book-store-sqs-send-order-confirmation` → **Create policy**

Jeśli polityka już istnieje — pomiń tworzenie, użyj jej w kroku 3.

---

## Krok 3 — Rola IAM dla EC2 + przypięcie do instancji

Nest w kontenerze/procesie bierze credentials z **roli instancji**. Jeśli w EC2 → Security → **IAM role** jest `-`, utwórz i przypnij rolę.

### 3a. Utwórz rolę

1. **IAM** → **Roles** → **Create role**
2. Trusted entity: **AWS service** → **EC2** → Next
3. Attach: `nest-book-store-sqs-send-order-confirmation` → Next
4. Role name: `nest-book-store-ec2-role` → Create  
   (powstanie też instance profile o tej samej nazwie)

### 3b. Przypnij do EC2

1. **EC2** → Instances → Twoja maszyna  
2. **Actions** → **Security** → **Modify IAM role**  
3. Wybierz `nest-book-store-ec2-role` → **Update IAM role**

W szczegółach instancji **IAM role** nie może być `-`.

---

## Krok 4 — Docker: hop limit IMDSv2 = 2

Przy **IMDSv2** domyślny hop limit **1** sprawia, że kontener Dockera **nie sięga** metadata roli → w logach Nest:

`CredentialsProviderError: Could not load credentials from any providers`

1. **EC2** → Instance → **Actions** → **Instance settings** → **Modify instance metadata options**
2. **Http put response hop limit**: **2**
3. Save

Potem recreate API:

```bash
# Docker (Etap 7a)
cd /var/www/nest-book-store/docker
docker compose up -d --force-recreate nest-api

# systemd (starszy deploy)
sudo systemctl restart nest-book-store
```

---

## Krok 5 — Rola IAM dla Lambdy

1. **IAM** → **Roles** → **Create role**
2. Trusted entity: **Lambda**
3. Attach: `AWSLambdaSQSQueueExecutionRole` (odczyt z SQS + logi CloudWatch)
4. Name: `nest-book-store-order-email-lambda-role` → Create

---

## Krok 6 — Funkcja Lambda

1. **Lambda** → **Create function** → Node.js **20.x** (lub 22.x), x86_64  
2. Name: `nest-book-store-order-confirmation-email`  
3. Role: `nest-book-store-order-email-lambda-role`  
4. Timeout **30 s**, memory **256 MB**  
5. **Configuration** → **Environment variables**:

| Variable        | Przykład                         |
| --------------- | -------------------------------- |
| `SMTP_HOST`     | host SMTP (np. GoDaddy)          |
| `SMTP_PORT`     | `465`                            |
| `SMTP_USER`     | login SMTP                       |
| `SMTP_PASSWORD` | hasło SMTP                       |
| `SMTP_SECURE`   | `true` (dla portu 465)           |
| `DOMAIN`        | `book-store.com.pl` (bez `@`)    |
| `STORE_NAME`    | `BookStore` (opcjonalnie)        |

6. **Add trigger** → **SQS** → kolejka `nest-book-store-order-confirmation`, batch size **1**

### Upload kodu

Z **roota repo**:

```bash
npm run lambda:package:order-email
```

Lambda Console → **Upload from** → **.zip** → `lambda/order-confirmation-email/function.zip`  
Handler: `index.handler`

Zmiana samego hasła SMTP: **Configuration → Environment variables** (bez ponownego zip).

---

## Krok 7 — Env na EC2

W `/var/www/nest-book-store/shared/.env.production`:

```env
ORDER_CONFIRMATION_QUEUE_URL=https://sqs.eu-central-1.amazonaws.com/ACCOUNT_ID/nest-book-store-order-confirmation
AWS_REGION=eu-central-1
TO_3=nest@book-store.com.pl
```

Gdy `ORDER_CONFIRMATION_QUEUE_URL` jest ustawione, Nest **nie** wysyła potwierdzenia zakupu lokalnym SMTP — tylko enqueue do SQS.  
Formularz kontaktowy nadal używa `SMTP_*` na EC2.

Restart / recreate jak w kroku 4.

---

## Weryfikacja

1. Opłać zamówienie testowe Stripe na `nest.book-store.pl`
2. Logi Nest — oczekiwane: `order confirmation email enqueued for …`

```bash
# Docker
cd /var/www/nest-book-store/docker
docker compose logs --tail 50 nest-api | grep -i enqueued

# systemd
sudo journalctl -u nest-book-store --since "10 min ago" | grep -i enqueued
```

3. CloudWatch → log group Lambdy → udane wywołanie  
4. Mail do klienta i `TO_3`

### Typowe błędy

| Objaw | Przyczyna |
|--------|-----------|
| `CredentialsProviderError` | brak roli na EC2 albo hop limit ≠ 2 przy Dockerze |
| `AccessDenied` na SQS | zła polityka / zły ARN kolejki |
| Enqueue OK, brak maila | Lambda SMTP / CloudWatch / spam |
| OVH działa, AWS nie | na OVH brak URL kolejki (SMTP); na AWS wymagane SQS+rola |

---

## Test Lambdy (Console)

**Test** z body jak w `lambda/order-confirmation-email/test-event.json`.

## Dev lokalny

Bez `ORDER_CONFIRMATION_QUEUE_URL` webhook używa `MailService.sendPurchaseReceipt` (SMTP z `backend/.env`).

Stripe webhook (AWS): `https://nest.book-store.pl/api/webhooks/stripe`
