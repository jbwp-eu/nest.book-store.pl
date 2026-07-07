/// <reference types="cypress" />

function submitAuthForm() {
  cy.get('input[name="email"], input[name="name"]')
    .first()
    .closest("form")
    .find('button[type="submit"]')
    .click();
}

describe("Authentication", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("displays login page", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
    cy.get('input[name="email"]')
      .closest("form")
      .find('button[type="submit"]')
      .should("be.visible");
  });

  it("logs in via API helper command", () => {
    cy.fixture("users.example").then((users) => {
      cy.env(["ADMIN_PASSWORD"]).then(({ ADMIN_PASSWORD }) => {
        expect(ADMIN_PASSWORD, "ADMIN_PASSWORD from backend/.env").to.be.a(
          "string",
        );
        cy.login(users.admin.email, ADMIN_PASSWORD as string);
        cy.window().then((win) => {
          expect(win.localStorage.getItem("token")).to.be.a("string");
          const userInfo = JSON.parse(
            win.localStorage.getItem("userInfo") ?? "{}",
          );
          expect(userInfo.isAdmin).to.eq(true);
        });
      });
    });
  });

  it("rejects invalid credentials", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("invalid@example.com");
    cy.get('input[name="password"]').type("wrongpassword");
    submitAuthForm();
    cy.url().should("include", "/login");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.be.null;
    });
  });

  it("registers a new user", () => {
    const email = `e2e-${Date.now()}@example.com`;
    cy.visit("/register");
    cy.get('input[name="name"]').type("E2E User");
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type("test1234");
    cy.get('input[name="storeTerms"]').check();
    submitAuthForm();
    cy.url().should("not.include", "/register", { timeout: 15000 });
    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.be.a("string");
    });
  });

  it("requires terms acceptance to register", () => {
    cy.visit("/register");
    cy.get('input[name="name"]').type("E2E User");
    cy.get('input[name="email"]').type(`e2e-${Date.now()}@example.com`);
    cy.get('input[name="password"]').type("test1234");
    submitAuthForm();
    cy.url().should("include", "/register");
    cy.contains(/regulamin|terms/i).should("be.visible");
  });

  it("logs out from user menu", () => {
    cy.loginAsAdmin();
    cy.visit("/");
    cy.get('button[aria-label*="Menu użytkownika"], button[aria-label*="User menu"]')
      .filter(":visible")
      .first()
      .click();
    cy.contains('[role="menuitem"]', /wyloguj|logout/i).click();
    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.be.null;
    });
  });
});
