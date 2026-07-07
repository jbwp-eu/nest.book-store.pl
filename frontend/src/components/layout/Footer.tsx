import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreditCard, Globe, Mail, RotateCcw, Truck } from "lucide-react";
import { fetchStoreLocation } from "@/api/storeLocation";
import Container from "@/components/layout/Container";
import StoreMapDialog from "@/components/store/StoreMapDialog";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/lib/env";
import { queryKeys } from "@/lib/query-keys";
import { footerNavLinks } from "@/links/links";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const infoItems = [
  {
    icon: Mail,
    titleKey: "footer.contact",
    descKey: null,
    href: "/contact",
    action: null,
  },
  {
    icon: Truck,
    titleKey: "footer.shippingTitle",
    descKey: "footer.shippingDesc",
    href: null,
    action: null,
  },
  {
    icon: RotateCcw,
    titleKey: "footer.moneyBackTitle",
    descKey: "footer.moneyBackDesc",
    href: null,
    action: null,
  },
  {
    icon: CreditCard,
    titleKey: "footer.paymentTitle",
    descKey: "footer.paymentDesc",
    href: null,
    action: null,
  },
  {
    icon: Globe,
    titleKey: "footer.storeLocator",
    descKey: null,
    href: null,
    action: "storeMap" as const,
  },
] as const;

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const locale = useAppSelector((state) => state.ui.language);
  const [storeMapOpen, setStoreMapOpen] = useState(false);

  const { data: storeLocation } = useQuery({
    queryKey: queryKeys.storeLocation.detail(locale),
    queryFn: () => fetchStoreLocation(locale),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <footer className="mt-auto border-t bg-muted/30 py-8">
      <Container>
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-5">
              {infoItems.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon className="mb-2 size-5 text-muted-foreground" />
                    <p className="text-sm font-semibold">{t(item.titleKey)}</p>
                    {item.descKey && (
                      <p className="mt-1 text-sm font-light text-muted-foreground">
                        {t(item.descKey)}
                      </p>
                    )}
                  </>
                );

                if (item.action === "storeMap") {
                  return (
                    <button
                      key={item.titleKey}
                      type="button"
                      onClick={() => setStoreMapOpen(true)}
                      className={cn(
                        "rounded-md p-1 pt-0 text-left transition-colors hover:bg-muted flex flex-col justify-start",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      )}
                      style={{ alignItems: "flex-start" }}
                    >
                      {content}
                    </button>
                  );
                }

                if (item.href) {
                  return (
                    <Link
                      key={item.titleKey}
                      to={item.href}
                      className="rounded-md p-1 transition-colors hover:bg-muted"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={item.titleKey} className="p-1">
                    {content}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            {t("footer.demoNotice")}
          </p>

          <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row">
            <p>
              © {year} {env.appName}. {t("footer.rights")}
            </p>
            <nav className="flex items-center gap-4">
              {footerNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="hover:text-foreground"
                >
                  {t(link.titleKey)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </Container>

      <StoreMapDialog
        open={storeMapOpen}
        onClose={() => setStoreMapOpen(false)}
        storeLocation={storeLocation ?? null}
      />
    </footer>
  );
}

export default Footer;
