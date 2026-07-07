import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/locale";
import { commonEn } from "./translations/en";
import { commonPl } from "./translations/pl";

function readStoredLanguage(): AppLocale {
  const stored = localStorage.getItem("language");
  return stored === "en" || stored === "pl" ? stored : DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: commonEn },
    pl: { common: commonPl },
  },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

/** Loaders / actions: translate with an explicit locale (no React hook). */
export function translateLng(
  lng: AppLocale,
  key: string,
  options?: Record<string, unknown>
): string {
  return i18n.t(key, { lng, ...options });
}

export default i18n;
