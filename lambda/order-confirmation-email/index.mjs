import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_SECURE,
  DOMAIN,
  STORE_NAME = "BookStore",
} = process.env;

function requireEnv(name, value) {
  if (!value || String(value).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

function parseMessage(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error("Invalid SQS message body: not JSON");
  }

  const {
    orderId,
    userEmail,
    userName,
    itemsPrice,
    shippingPrice,
    totalPrice,
    paidAt,
    items,
    shippingAddress,
    adminEmail,
  } = parsed;

  if (!orderId || typeof orderId !== "string") {
    throw new Error("Invalid message: orderId required");
  }
  if (!userEmail || typeof userEmail !== "string") {
    throw new Error("Invalid message: userEmail required");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Invalid message: items required");
  }
  if (!shippingAddress || typeof shippingAddress !== "object") {
    throw new Error("Invalid message: shippingAddress required");
  }

  return {
    orderId,
    userEmail: userEmail.trim(),
    userName: typeof userName === "string" ? userName.trim() : "Customer",
    itemsPrice: Number(itemsPrice),
    shippingPrice: Number(shippingPrice),
    totalPrice: Number(totalPrice),
    paidAt: typeof paidAt === "string" ? paidAt : new Date().toISOString(),
    items,
    shippingAddress,
    adminEmail:
      typeof adminEmail === "string" && adminEmail.trim()
        ? adminEmail.trim()
        : undefined,
  };
}

function formatItems(items) {
  return items
    .map((item) => {
      const title = String(item.title ?? "Item");
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.price ?? 0);
      return `  - ${title} x${qty} @ ${price.toFixed(2)} PLN`;
    })
    .join("\n");
}

function formatAddress(addr) {
  return [addr.address, `${addr.code} ${addr.city}`].filter(Boolean).join("\n");
}

function buildEmailContent(msg) {
  const shortId = msg.orderId.slice(-6);
  const subject = `Potwierdzenie zakupu — zamówienie ...${shortId}`;
  const itemsTotal = Number.isFinite(msg.itemsPrice)
    ? msg.itemsPrice.toFixed(2)
    : String(msg.itemsPrice);
  const shippingTotal = Number.isFinite(msg.shippingPrice)
    ? msg.shippingPrice.toFixed(2)
    : String(msg.shippingPrice);
  const orderTotal = Number.isFinite(msg.totalPrice)
    ? msg.totalPrice.toFixed(2)
    : String(msg.totalPrice);

  const text = [
    `Witaj ${msg.userName},`,
    "",
    `Dziękujemy za zakup w ${STORE_NAME}. Otrzymaliśmy płatność za Twoje zamówienie.`,
    "",
    `ID zamówienia: ...${shortId}`,
    `Data: ${msg.paidAt}`,
    "",
    "Produkty:",
    formatItems(msg.items),
    "",
    `Produkty: ${itemsTotal} PLN`,
    `Dostawa: ${shippingTotal} PLN`,
    `Zapłacono: ${orderTotal} PLN`,
    "",
    "Adres dostawy:",
    formatAddress(msg.shippingAddress),
    "",
    "W razie pytań odpowiedz na ten e-mail lub skontaktuj się przez stronę sklepu.",
  ].join("\n");

  return { subject, text };
}

function createTransport() {
  requireEnv("SMTP_HOST", SMTP_HOST);
  requireEnv("SMTP_USER", SMTP_USER);
  requireEnv("SMTP_PASSWORD", SMTP_PASSWORD);
  requireEnv("DOMAIN", DOMAIN);

  const port = SMTP_PORT ? Number(SMTP_PORT) : 465;
  const secure =
    SMTP_SECURE === "true" || (SMTP_SECURE !== "false" && port === 465);

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    ...(port !== 465 && { requireTLS: true }),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export async function handler(event) {
  const records = event?.Records;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("No SQS records in event");
  }

  const transport = createTransport();

  for (const record of records) {
    const msg = parseMessage(record.body);
    const { subject, text } = buildEmailContent(msg);
    const to = msg.adminEmail
      ? `${msg.userEmail}, ${msg.adminEmail}`
      : msg.userEmail;

    await transport.sendMail({
      from: `"${STORE_NAME}" <nest@${DOMAIN}>`,

      to,
      subject,
      text,
    });

    console.log("Order confirmation email sent", {
      orderId: msg.orderId,
      to: msg.userEmail,
    });
  }
}
