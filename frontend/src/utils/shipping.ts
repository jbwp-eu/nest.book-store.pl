import { env } from "@/lib/env";
import type { CartItem } from "@/store/cartSlice";

/** Keep in sync with backend `calc-prices.ts`. */
export const FREE_SHIPPING_THRESHOLD_PLN = 200;
export const SHIPPING_COST_PLN = 20;

export type CartOrderTotals = {
  itemsQuantity: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeShippingCost(itemsSubtotal: number): number {
  if (itemsSubtotal <= 0) return 0;
  return itemsSubtotal < FREE_SHIPPING_THRESHOLD_PLN ? SHIPPING_COST_PLN : 0;
}

export function computeCartTotals(items: CartItem[]): CartOrderTotals {
  const itemsQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsPrice = round2(
    items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
  );
  const shippingPrice = round2(computeShippingCost(itemsPrice));
  const taxPrice = round2(env.tax * itemsPrice);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  return { itemsQuantity, itemsPrice, shippingPrice, taxPrice, totalPrice };
}
