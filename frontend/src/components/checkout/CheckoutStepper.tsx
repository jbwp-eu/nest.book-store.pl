import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const steps = [
  { path: "/cart", labelKey: "checkoutSteps.cart" },
  { path: "/shipping", labelKey: "checkoutSteps.shipping" },
  { path: "/payment", labelKey: "checkoutSteps.payment" },
  { path: "/checkout", labelKey: "checkoutSteps.review" },
] as const;

function CheckoutStepper() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const activeIndex = steps.findIndex((step) => step.path === pathname);

  return (
    <nav
      aria-label={t("checkoutSteps.label")}
      className="mb-6 flex flex-wrap gap-2 text-sm"
    >
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = activeIndex > index;

        return (
          <div key={step.path} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-muted-foreground/50" aria-hidden>
                /
              </span>
            )}
            {isPast || isActive ? (
              <Link
                to={step.path}
                className={cn(
                  "rounded-md px-2 py-1 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-primary hover:underline"
                )}
              >
                {t(step.labelKey)}
              </Link>
            ) : (
              <span className="px-2 py-1 text-muted-foreground">
                {t(step.labelKey)}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default CheckoutStepper;
