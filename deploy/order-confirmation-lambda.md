# Order confirmation email (SQS + Lambda + SMTP)

EC2 enqueues a message when Stripe marks an order paid; Lambda sends the confirmation email via SMTP.

Uses `/var/www/nest-book-store/shared/.env.production` on EC2 (IAM role for SQS — no access keys on server).

## Prerequisites

- AWS region: **eu-central-1** (same as EC2)
- SMTP credentials for Lambda env vars (`SMTP_*`, `EMAIL_FROM`)
- EC2 instance IAM role (recommended) with `sqs:SendMessage` to the queue

## Step 1: Kolejka SQS (Simple Queue Service – kolejka komunikatów AWS)

1. AWS Console → **SQS** → **Create queue**
2. Type: **Standard**
3. Name: `nest-book-store-order-confirmation`
4. Visibility timeout: **60** seconds
5. Create queue; copy **Queue URL**

## Step 2: IAM role for Lambda (IAM — Identity and Access Management)

1. **IAM** → **Roles** → **Create role**
2. Trusted entity: **Lambda**
3. Attach: `AWSLambdaSQSQueueExecutionRole`
4. Name: `nest-book-store-order-email-lambda-role`

## Krok 3: Czym jest ta sekcja?

To opis polityki IAM dla EC2, która umożliwia instancjom EC2 wysyłanie wiadomości do kolejki SQS (uprawnienie `sqs:SendMessage` do kolejki z potwierdzeniem zamówienia).

1. **IAM** → **Policies** → **Create policy** → JSON:

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

2. Name: `nest-book-store-sqs-send-order-confirmation`
3. Attach to the **EC2 instance IAM role**

## Step 4: Lambda function

1. **Lambda** → **Create function** → Node.js **20.x**, x86_64
2. Name: `nest-book-store-order-confirmation-email`
3. Role: `nest-book-store-order-email-lambda-role`
4. Timeout **30 s**, memory **256 MB**
5. Environment variables:

| Variable        | Example                |
| --------------- | ---------------------- |
| `SMTP_HOST`     | your SMTP host         |
| `SMTP_PORT`     | `465`                  |
| `SMTP_USER`     | SMTP username          |
| `SMTP_PASSWORD` | SMTP password          |
| `SMTP_SECURE`   | `true` (port 465)      |
| `DOMAIN`        | `@yourdomain.pl`       |
| `STORE_NAME`    | `BookStore` (optional) |

6. **Add trigger** → **SQS** → queue `nest-book-store-order-confirmation`, batch size **1**

## Step 5: Upload Lambda code

From **repo root**:

```bash
npm run lambda:package:order-email
```

Lambda Console → **Upload from** → **.zip file** → `lambda/order-confirmation-email/function.zip`

Handler: `index.handler`

## Step 6: EC2 environment

Add to `/var/www/nest-book-store/shared/.env.production`:

```env
ORDER_CONFIRMATION_QUEUE_URL=https://sqs.eu-central-1.amazonaws.com/YOUR_ACCOUNT_ID/nest-book-store-order-confirmation
AWS_REGION=eu-central-1
TO_3=admin@test.pl
```

When `ORDER_CONFIRMATION_QUEUE_URL` is set, Nest enqueues to SQS instead of sending SMTP directly from EC2. Contact form still uses SMTP on EC2 (`SMTP_*`, `TO_1`, `TO_2`).

Restart:

```bash
sudo systemctl restart nest-book-store
```

Redeploy backend release or copy updated `dist/` so EC2 runs code with SQS support.

## Test Lambda (Console)

Use **Test** with SQS template and body from `lambda/order-confirmation-email/test-event.json`.

## Verify end-to-end

1. Place a Stripe **test** order and complete payment
2. CloudWatch → Lambda log group → successful invocation
3. EC2 logs (`journalctl -u nest-book-store`): `order confirmation email enqueued`
4. Customer (and `TO_3` admin) receive confirmation email

Stripe webhook URL (unchanged): `https://nest.book-store.pl/api/webhooks/stripe`

## Local dev

Without `ORDER_CONFIRMATION_QUEUE_URL`, webhook falls back to direct SMTP via `MailService.sendPurchaseReceipt` (requires `SMTP_*` and `DOMAIN` in `.env`).
