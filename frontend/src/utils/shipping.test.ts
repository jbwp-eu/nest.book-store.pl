import { computeCartTotals, computeShippingCost } from "@/utils/shipping";

describe("shipping utils", () => {
  it("charges shipping below free threshold", () => {
    expect(computeShippingCost(199.99)).toBe(20);
  });

  it("offers free shipping at threshold", () => {
    expect(computeShippingCost(200)).toBe(0);
  });

  it("returns zero shipping for empty cart subtotal", () => {
    expect(computeShippingCost(0)).toBe(0);
  });

  it("computes cart totals with tax and shipping", () => {
    const totals = computeCartTotals([
      { productId: "aptekarka", quantity: 2, price: 49.99 },
    ]);

    expect(totals.itemsQuantity).toBe(2);
    expect(totals.itemsPrice).toBe(99.98);
    expect(totals.shippingPrice).toBe(20);
    expect(totals.totalPrice).toBe(119.98);
  });
});
