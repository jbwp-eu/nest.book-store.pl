/// <reference types="cypress" />

describe("Stripe payment success return", () => {
  const orderId = "e2e-stripe-return-order";
  const successPath = `/order/${orderId}/payment-success?redirect_status=succeeded`;

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirects to login when session is missing", () => {
    cy.visit(successPath);
    cy.url().should("include", "/login");
    cy.url().should("include", "redirect=");
  });

  it("keeps authenticated user on success page after Stripe redirect", () => {
    cy.loginAsAdmin();
    cy.visit(successPath);
    cy.url().should("include", "/payment-success");
    cy.contains(/płatność zakończona|payment complete/i).should("be.visible");
  });

  it("allows success page when userInfo remains in localStorage after token removal", () => {
    cy.loginAsAdmin();
    cy.window().then((win) => {
      win.localStorage.removeItem("token");
      win.localStorage.removeItem("expiration");
    });
    cy.visit(successPath);
    cy.url().should("include", "/payment-success");
    cy.contains(/płatność zakończona|payment complete/i).should("be.visible");
  });
});
