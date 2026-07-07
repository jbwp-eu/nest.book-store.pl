import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Container from "@/components/layout/Container";
import BookStoreLogo from "@/components/layout/BookStoreLogo";
import CartNavLink from "@/components/layout/CartNavLink";
import HeaderAuthMenu from "@/components/layout/HeaderAuthMenu";
import HeaderSearch from "@/components/layout/HeaderSearch";
import HomeNavLink from "@/components/layout/HomeNavLink";
import MobileNav from "@/components/layout/MobileNav";
import { UiControls } from "@/components/layout/UiControls";
import { env } from "@/lib/env";
import { publicNavLinks } from "@/links/links";
import { cn } from "@/lib/utils";

function HeaderNavLinks({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <nav className={className}>
      {publicNavLinks.map((link) => (
        <NavLink
          key={link.href}
          to={link.href}
          end={link.href === "/"}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground",
            )
          }
        >
          {t(link.titleKey)}
        </NavLink>
      ))}
    </nav>
  );
}

function HeaderBrandLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <BookStoreLogo className="shrink-0" />
      <span className="truncate">{env.appName}</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container>
        {/* Mobile: logo row + controls row — no overlap */}
        <div className="flex flex-col gap-2 py-2 sm-md:hidden">
          <div className="flex items-center gap-2">
            <MobileNav />
            <HeaderBrandLink className="min-w-0 flex-1" />
            <HomeNavLink className="shrink-0" />
            <CartNavLink className="shrink-0" />
            <HeaderAuthMenu compact className="shrink-0" />
          </div>
          <div className="flex justify-end overflow-x-auto pb-0.5">
            <UiControls />
          </div>
        </div>

        {/* Desktop: auth pinned top-right; remaining items wrap in the left column */}
        <div className="hidden min-h-14 flex-wrap items-center justify-end gap-x-3 py-2 gap-y-2 sm-md:flex">
          <HeaderBrandLink className="shrink-0" />
          <HeaderNavLinks className="flex items-center gap-1" />
          <HeaderSearch className="min-w-0 max-w-md flex-1 basis-48" />
          <UiControls className="sm-md:order-2 md-lg:order-1" />
          <div className="flex items-center gap-2 sm-md:order-1 md-lg:order-2">
            <CartNavLink showLabel />
            <HeaderAuthMenu className="shrink-0 " />
          </div>

          {/* <div className="flex flex-wrap items-center justify-end gap-2"></div> */}
        </div>
      </Container>
    </header>
  );
}

export default Header;
