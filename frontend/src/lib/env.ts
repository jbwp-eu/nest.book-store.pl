/** Typed access to Vite env vars with fallbacks for local dev. */
export const env = {
  port: Number(import.meta.env.VITE_PORT) || 5173,
  backendUrl: import.meta.env.DEV
    ? (import.meta.env.VITE_BACKEND_URL_TEST_MODE ??
      "http://localhost:3004/api")
    : (import.meta.env.VITE_BACKEND_URL ??
      "https://nest.book-store.pl/api"),
  assetUrl:
    import.meta.env.VITE_ASSET_URL ??
    "https://d8gge2z531r61.cloudfront.net",
  appName: import.meta.env.VITE_APP_NAME ?? "BookStore",
  language: import.meta.env.VITE_LANGUAGE === "en" ? "en" : "pl",
  tax: Number(import.meta.env.VITE_TAX) || 0,
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE,
  stripeConfirmPaymentUrl: import.meta.env.DEV
    ? (import.meta.env.VITE_STRIPE_CONFIRMPAYMENT_URL_TEST_MODE ??
      "http://localhost:5173")
    : (import.meta.env.VITE_STRIPE_CONFIRMPAYMENT_URL ??
      "https://nest.book-store.pl"),
} as const;

export type AppLanguage = (typeof env)["language"];
