/// <reference types="cypress" />

describe("Cart", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
  });

  it("adds a product to cart from detail page", () => {
    cy.getFirstProduct().then((product) => {
      cy.visit(`/product/${product.id}`);
      cy.contains("button", /dodaj do koszyka|add to cart/i).click();
      cy.visit("/cart");
      cy.contains(product.title).should("be.visible");
    });
  });

  it("shows empty cart message when cart is empty", () => {
    cy.visit("/cart");
    cy.contains(/koszyk jest pusty|cart is empty/i).should("be.visible");
  });
});
