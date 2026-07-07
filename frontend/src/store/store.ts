import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./authSlice";
import { cartSlice } from "./cartSlice";
import { uiSlice } from "./uiSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
