import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Menu, Package, Shield, Star, User } from "lucide-react";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { publicNavLinks } from "@/links/links";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { selectCartItemsCount } from "@/store/cartSelectors";

function MobileNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { isLoggedIn, userInfo, logout } = useAuth();
  const cartCount = useAppSelector(selectCartItemsCount);

  const close = () => setOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-muted text-foreground"
        : "text-foreground/90 hover:bg-muted hover:text-foreground",
    );

  const handleLogout = () => {
    logout();
    close();
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="gap-0 overflow-y-auto border bg-card p-0 text-card-foreground shadow-xl [&_[data-slot=sheet-close]]:text-foreground [&_[data-slot=sheet-close]]:opacity-100"
      >
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle className="text-card-foreground">{t("nav.menu")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("nav.menuDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <HeaderSearch compact onNavigate={close} />

          <nav className="flex flex-col gap-1">
            {publicNavLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === "/"}
                className={linkClass}
                onClick={close}
              >
                {t(link.titleKey)}
              </NavLink>
            ))}

            <NavLink to="/cart" className={linkClass} onClick={close}>
              <span>{t("nav.cart")}</span>
              {cartCount > 0 && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="space-y-4 border-t border-border pt-4">
            {isLoggedIn ? (
              <nav className="flex flex-col gap-1">
                <p className="px-3 pb-2 text-xs text-foreground/70">
                  {userInfo.name}
                </p>
                <NavLink to="/profile" className={linkClass} onClick={close}>
                  <User className="size-4" />
                  {t("nav.profile")}
                </NavLink>
                <NavLink to="/my-orders" className={linkClass} onClick={close}>
                  <Package className="size-4" />
                  {t("nav.myOrders")}
                </NavLink>
                <NavLink to="/my-reviews" className={linkClass} onClick={close}>
                  <Star className="size-4" />
                  {t("nav.myReviews")}
                </NavLink>
                {userInfo.isAdmin && (
                  <NavLink
                    to="/admin/overview"
                    className={linkClass}
                    onClick={close}
                  >
                    <Shield className="size-4" />
                    {t("nav.admin")}
                  </NavLink>
                )}
                <button
                  type="button"
                  className={cn(
                    linkClass({ isActive: false }),
                    "w-full text-left",
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  {t("nav.logout")}
                </button>
              </nav>
            ) : (
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link to="/login" onClick={close}>
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={close}>
                    {t("nav.register")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
