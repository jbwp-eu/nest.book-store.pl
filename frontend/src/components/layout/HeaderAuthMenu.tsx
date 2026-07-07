import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Package, Shield, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type HeaderAuthMenuProps = {
  compact?: boolean;
  className?: string;
};

function HeaderAuthMenu({ compact = false, className }: HeaderAuthMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    if (compact) {
      return (
        <Button
          asChild
          variant="outline"
          size="icon"
          className={cn("shrink-0", className)}
        >
          <Link to="/login" aria-label={t("nav.login")}>
            <User className="size-4" />
          </Link>
        </Button>
      );
    }

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">{t("nav.login")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/register">{t("nav.register")}</Link>
        </Button>
      </div>
    );
  }

  const initial = userInfo.name?.charAt(0).toUpperCase() ?? "?";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("rounded-full shrink-0", className)}
          aria-label={t("nav.userMenu")}
        >
          <span className="text-sm font-medium">{initial}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium">{userInfo.name}</p>
          <p className="text-xs text-muted-foreground">{userInfo.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="size-4" />
            {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-orders" className="cursor-pointer">
            <Package className="size-4" />
            {t("nav.myOrders")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-reviews" className="cursor-pointer">
            <Star className="size-4" />
            {t("nav.myReviews")}
          </Link>
        </DropdownMenuItem>
        {userInfo.isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin/overview" className="cursor-pointer">
              <Shield className="size-4" />
              {t("nav.admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="size-4" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default HeaderAuthMenu;
