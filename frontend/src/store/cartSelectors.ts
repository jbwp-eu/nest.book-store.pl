import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import { computeCartTotals } from "../utils/shipping";

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartItemsCount = createSelector([selectCartItems], (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

export const selectCartOrderTotals = createSelector([selectCartItems], (items) =>
  computeCartTotals(items)
);
