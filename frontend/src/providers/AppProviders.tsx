import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import i18n from "@/i18n/i18n";
import { queryClient } from "@/lib/query-client";
import { store } from "@/store/store";
import { useAppSelector } from "@/store/hooks";
import type { Theme } from "@/store/uiSlice";

function ThemeApplier() {  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    const resolved: Exclude<Theme, "system"> =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(resolved);
  }, [theme]);

  return null;
}

function I18nSync() {
  const language = useAppSelector((state) => state.ui.language);

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return null;
}

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeApplier />
        <I18nSync />
        {children}
        <Toaster richColors closeButton position="bottom-right" />
      </QueryClientProvider>
    </Provider>
  );
}
