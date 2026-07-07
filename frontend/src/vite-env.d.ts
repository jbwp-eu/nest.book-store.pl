/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORT: string;
  readonly VITE_BACKEND_URL_TEST_MODE: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_ASSET_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_LANGUAGE: "pl" | "en";
  readonly VITE_TAX: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY_TEST_MODE: string;
  readonly VITE_STRIPE_CONFIRMPAYMENT_URL_TEST_MODE: string;
  readonly VITE_STRIPE_CONFIRMPAYMENT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
