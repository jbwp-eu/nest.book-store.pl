import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/lib/locale";

export type Theme = "light" | "dark" | "system";

type UiState = {
  language: AppLocale;
  theme: Theme;
};

const LANGUAGE_KEY = "language";
const THEME_KEY = "vite-ui-theme";

function readLanguage(): AppLocale {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  return stored && isAppLocale(stored) ? stored : DEFAULT_LOCALE;
}

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

const initialState: UiState = {
  language: readLanguage(),
  theme: readTheme(),
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<AppLocale>) {
      state.language = action.payload;
      localStorage.setItem(LANGUAGE_KEY, action.payload);
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      localStorage.setItem(THEME_KEY, action.payload);
    },
  },
});

export const { setLanguage, setTheme } = uiSlice.actions;
