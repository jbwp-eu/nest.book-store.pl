/** Typed access to Vite env vars with fallbacks for local dev. */

export type DeployTarget = "ovh" | "aws";

const deployTarget: DeployTarget =
  import.meta.env.VITE_DEPLOY_TARGET === "aws" ? "aws" : "ovh";

const backendByTarget = {
  ovh: import.meta.env.VITE_BACKEND_URL_OVH,
  aws: import.meta.env.VITE_BACKEND_URL_AWS,
} as const;

const stripeKeyByTarget = {
  ovh: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE_OVH,
  aws: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AWS,
} as const;

const confirmByTarget = {
  ovh: import.meta.env.VITE_STRIPE_CONFIRMPAYMENT_URL_OVH,
  aws: import.meta.env.VITE_STRIPE_CONFIRMPAYMENT_URL_AWS,
} as const;

export const env = {
  port: Number(import.meta.env.VITE_PORT) || 5173,
  deployTarget,
  backendUrl: import.meta.env.DEV
    ? (import.meta.env.VITE_BACKEND_URL_TEST_MODE ??
      "http://localhost:3004/api")
    : (backendByTarget[deployTarget] ??
      "https://nest.book-store.com.pl/api"),
  assetUrl:
    import.meta.env.VITE_ASSET_URL ??
    "https://d8gge2z531r61.cloudfront.net",
  appName: import.meta.env.VITE_APP_NAME ?? "BookStore",
  language: import.meta.env.VITE_LANGUAGE === "en" ? "en" : "pl",
  tax: Number(import.meta.env.VITE_TAX) || 0,
  stripePublishableKey: stripeKeyByTarget[deployTarget],
  stripeConfirmPaymentUrl: import.meta.env.DEV
    ? (import.meta.env.VITE_STRIPE_CONFIRMPAYMENT_URL_TEST_MODE ??
      "http://localhost:5173")
    : (confirmByTarget[deployTarget] ?? "https://nest.book-store.com.pl"),
} as const;

export type AppLanguage = (typeof env)["language"];
