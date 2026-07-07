import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { selectCartItemsCount } from "@/store/cartSelectors";

type CartNavLinkProps = {
  className?: string;
  showLabel?: boolean;
  onNavigate?: () => void;
};

function CartNavLink({
  className,
  showLabel = false,
  onNavigate,
}: CartNavLinkProps) {
  const { t } = useTranslation();
  const cartCount = useAppSelector(selectCartItemsCount);

  return (
    <Button
      asChild
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      className={cn(showLabel && "gap-2", className)}
    >
      <Link to="/cart" aria-label={t("nav.cart")} onClick={onNavigate}>
        <span className="relative inline-flex">
          <ShoppingCart className="size-4" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </span>
        {showLabel && (
          <span>
            {t("nav.cart")}
            {cartCount > 0 ? ` (${cartCount})` : ""}
          </span>
        )}
      </Link>
    </Button>
  );
}

export default CartNavLink;
