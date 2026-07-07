/// <reference types="cypress" />

describe("Product browsing", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("lists products on homepage", () => {
    cy.get('a[href*="/product/"]', { timeout: 15000 }).should(
      "have.length.at.least",
      1,
    );
  });

  it("opens product detail page", () => {
    cy.get('a[href*="/product/"]').first().click();
    cy.url().should("match", /\/product\/\w+/);
  });

  it("shows seeded product details", () => {
    cy.fixture("products").then(({ products }) => {
      const expectedTitle = products[0].title;
      cy.getFirstProduct(expectedTitle).then((product) => {
        cy.visit(`/product/${product.id}`);
        cy.contains(product.title).should("be.visible");
      });
    });
  });
});
