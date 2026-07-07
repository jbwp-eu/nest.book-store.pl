/// <reference types="cypress" />

const CypressRuntime = (
  globalThis as unknown as {
    Cypress: {
      Commands: { add: (name: string, fn: (...args: never[]) => void) => void };
      config: () => {
        env?: { VITE_BACKEND_URL?: string; ADMIN_PASSWORD?: string };
      };
    };
  }
).Cypress;

function requireAdminPassword(): Cypress.Chainable<string> {
  return cy.env(["ADMIN_PASSWORD"]).then(({ ADMIN_PASSWORD }) => {
    if (!ADMIN_PASSWORD || typeof ADMIN_PASSWORD !== "string") {
      throw new Error(
        "ADMIN_PASSWORD is required — set ADMIN_PASSWORD in backend/.env or export CYPRESS_ADMIN_PASSWORD",
      );
    }
    return ADMIN_PASSWORD;
  });
}

function getBackendUrl(): Cypress.Chainable<string> {
  return cy.env(["VITE_BACKEND_URL"]).then(({ VITE_BACKEND_URL }) => {
    if (typeof VITE_BACKEND_URL === "string" && VITE_BACKEND_URL.length > 0) {
      return VITE_BACKEND_URL;
    }
    return "http://localhost:3004/api";
  });
}

CypressRuntime.Commands.add("getFirstProduct", (title?: string) => {
  return getBackendUrl().then((backendUrl) =>
    cy
      .request({
        method: "GET",
        url: `${backendUrl}/products`,
        headers: {
          "x-app-locale": "pl",
        },
      })
      .then((response) => {
        const body = response.body as {
          products?: Array<{ id: string; title: string }>;
        };
        const products = body.products ?? [];
        if (products.length === 0) {
          throw new Error("No products returned from API");
        }

        const product = title
          ? (products.find((item) => item.title === title) ?? products[0])
          : products[0];

        return product;
      }),
  );
});

CypressRuntime.Commands.add("login", (email: string, password: string) => {
  getBackendUrl().then((backendUrl) => {
    cy.request({
      method: "POST",
      url: `${backendUrl}/users/login`,
      body: { email, password },
      headers: {
        "Content-Type": "application/json",
        "x-app-locale": "pl",
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status !== 200 || !response.body.token) {
        throw new Error(
          `Login failed: ${response.body?.message ?? "Unknown error"}`,
        );
      }

      cy.visit("/", { log: false });

      cy.window().then((win) => {
        win.localStorage.setItem("token", response.body.token);

        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 60);
        win.localStorage.setItem("expiration", expiration.toISOString());

        const userInfo = {
          id: null,
          name: response.body.name ?? "",
          email: response.body.email ?? email,
          isAdmin: response.body.isAdmin ?? false,
        };
        win.localStorage.setItem("userInfo", JSON.stringify(userInfo));
      });
    });
  });
});

CypressRuntime.Commands.add("loginAsAdmin", () => {
  cy.fixture("users.example").then((users) => {
    requireAdminPassword().then((password) => {
      cy.login(users.admin.email, password);
    });
  });
});

CypressRuntime.Commands.add("loginAsAdminViaUI", () => {
  cy.fixture("users.example").then((users) => {
    requireAdminPassword().then((password) => {
      cy.visit("/login");
      cy.get('input[name="email"]').type(users.admin.email);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should("not.include", "/login", { timeout: 15000 });
      cy.window().should((win) => {
        const userInfo = win.localStorage.getItem("userInfo");
        expect(userInfo).to.be.a("string");
        const parsed = JSON.parse(userInfo!) as { isAdmin?: boolean };
        expect(parsed.isAdmin).to.eq(true);
      });
    });
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsAdminViaUI(): Chainable<void>;
      getFirstProduct(title?: string): Chainable<{ id: string; title: string }>;
    }
  }
}

export {};
