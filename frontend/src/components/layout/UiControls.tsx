import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLanguage, setTheme, type Theme } from "@/store/uiSlice";
import { cn } from "@/lib/utils";

const themes: Theme[] = ["light", "dark", "system"];

const themeIcons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabelKeys: Record<Theme, string> = {
  system: "nav.themeSystem",
  light: "nav.themeLight",
  dark: "nav.themeDark",
};

export function UiControls({ className }: { className?: string }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.ui.language);
  const theme = useAppSelector((state) => state.ui.theme);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-1.5 ",
        className,
      )}
    >
      <Button
        variant={language === "pl" ? "default" : "outline"}
        size="sm"
        onClick={() => dispatch(setLanguage("pl"))}
        aria-label={t("nav.localePl")}
      >
        {t("nav.localePl")}
      </Button>
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => dispatch(setLanguage("en"))}
        aria-label={t("nav.localeEn")}
      >
        {t("nav.localeEn")}
      </Button>
      <div
        className="inline-flex rounded-lg border p-0.5"
        role="group"
        aria-label={t("nav.theme")}
      >
        {themes.map((value) => {
          const Icon = themeIcons[value];
          return (
            <Button
              key={value}
              type="button"
              variant={theme === value ? "default" : "ghost"}
              size="icon-sm"
              className={cn(
                "size-8",
                theme !== value && "text-muted-foreground",
              )}
              onClick={() => dispatch(setTheme(value))}
              aria-label={t(themeLabelKeys[value])}
              title={t(themeLabelKeys[value])}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
