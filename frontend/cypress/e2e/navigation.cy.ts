/// <reference types="cypress" />

describe("Navigation", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("loads the homepage with demo notice", () => {
    cy.url().should("include", "/");
    cy.contains(/aplikacja demonstracyjna|demo application/i).should(
      "be.visible",
    );
  });

  it("navigates to cart, login and home", () => {
    cy.visit("/cart");
    cy.url().should("include", "/cart");

    cy.visit("/login");
    cy.url().should("include", "/login");

    cy.visit("/");
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  });

  it("opens cart from header link", () => {
    cy.viewport(1280, 720);
    cy.get('a[href="/cart"]').filter(":visible").click();
    cy.url().should("include", "/cart");
  });

  it("redirects unauthenticated users from protected routes", () => {
    cy.clearLocalStorage();
    cy.visit("/shipping");
    cy.url().should("include", "/login");
  });

  it("redirects guests from admin routes", () => {
    cy.clearLocalStorage();
    cy.visit("/admin/overview");
    cy.url().should("include", "/login");
  });

  it("shows footer with store locator", () => {
    cy.get("footer").should("be.visible");
    cy.contains(/jak dojechać|get directions/i).should("be.visible");
  });
});
