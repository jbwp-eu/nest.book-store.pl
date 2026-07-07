import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const CART_KEY = "cart";

export type CartItem = {
  productId: string;
  quantity: number;
  title?: string;
  price?: number;
  imageUrl?: string;
  countInStock?: number;
};

export type ShippingAddress = {
  address: string;
  city: string;
  code: string;
};

export type CartState = {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  selectedPaymentMethod: string | null;
};

function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CartItem).productId === "string" &&
        typeof (item as CartItem).quantity === "number"
    );
  } catch {
    return [];
  }
}

function persistItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const initialState: CartState = {
  items: readCartItems(),
  shippingAddress: null,
  selectedPaymentMethod: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{
        productId: string;
        quantity?: number;
        title?: string;
        price?: number;
        imageUrl?: string;
        countInStock?: number;
      }>
    ) => {
      const {
        productId,
        quantity = 1,
        title,
        price,
        imageUrl,
        countInStock,
      } = action.payload;

      const existing = state.items.find((item) => item.productId === productId);
      if (existing) {
        const max = countInStock ?? existing.countInStock;
        const nextQty = existing.quantity + quantity;
        existing.quantity =
          max != null ? Math.min(nextQty, max) : nextQty;
        if (title !== undefined) existing.title = title;
        if (price !== undefined) existing.price = price;
        if (imageUrl !== undefined) existing.imageUrl = imageUrl;
        if (countInStock !== undefined) existing.countInStock = countInStock;
      } else {
        const cappedQty =
          countInStock != null
            ? Math.min(quantity, countInStock)
            : quantity;
        state.items.push({
          productId,
          quantity: cappedQty,
          ...(title !== undefined && { title }),
          ...(price !== undefined && { price }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(countInStock !== undefined && { countInStock }),
        });
      }

      persistItems(state.items);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      persistItems(state.items);
    },
    setQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (entry) => entry.productId === action.payload.productId
      );
      if (!item) return;

      if (action.payload.quantity <= 0) {
        state.items = state.items.filter(
          (entry) => entry.productId !== action.payload.productId
        );
      } else {
        const max = item.countInStock ?? Number.MAX_SAFE_INTEGER;
        item.quantity = Math.min(action.payload.quantity, max);
      }

      persistItems(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.shippingAddress = null;
      state.selectedPaymentMethod = null;
      persistItems(state.items);
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.selectedPaymentMethod = action.payload;
    },
    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
    },
  },
});

export const {
  addItem,
  removeItem,
  setQuantity,
  clearCart,
  setPaymentMethod,
  setShippingAddress,
} = cartSlice.actions;
