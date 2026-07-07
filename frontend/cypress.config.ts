import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "cypress";
import { readAdminPasswordFromBackendEnv } from "./cypress/load-backend-env";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://localhost:5173",
    requestTimeout: 10000,
    pageLoadTimeout: 30000,
    defaultCommandTimeout: 10000,
    env: {
      VITE_BACKEND_URL:
        process.env.VITE_BACKEND_URL ?? "http://localhost:3004/api",
      ADMIN_PASSWORD:
        process.env.CYPRESS_ADMIN_PASSWORD ??
        process.env.ADMIN_PASSWORD ??
        readAdminPasswordFromBackendEnv(configDir),
    },
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    async setupNodeEvents(on, config) {
      const vitePreprocessor = (await import("cypress-vite")).default;
      on("file:preprocessor", vitePreprocessor());
      return config;
    },
  },
});
