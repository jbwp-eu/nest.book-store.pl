import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CartLineItem from "@/components/cart/CartLineItem";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCartItems, selectCartOrderTotals } from "@/store/cartSelectors";
import { clearCart } from "@/store/cartSlice";

function CartPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totals = useAppSelector(selectCartOrderTotals);
  const isEmpty = items.length === 0;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("cart.title")}
      </h1>

      {isEmpty ? (
        <div className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <Button asChild>
            <Link to="/">{t("cart.continueShopping")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <CartLineItem key={item.productId} item={item} />
            ))}
          </div>

          <div className="mx-auto max-w-md space-y-2 rounded-xl border bg-card p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("cart.subtotal")}
              </span>
              <span>{formatCurrency(totals.itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("cart.shipping")}
              </span>
              <span>
                {totals.shippingPrice === 0
                  ? t("cart.shippingFree")
                  : formatCurrency(totals.shippingPrice)}
              </span>
            </div>
            {totals.taxPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("order.tax")}</span>
                <span>{formatCurrency(totals.taxPrice)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>{t("cart.total")}</span>
              <span>{formatCurrency(totals.totalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cart.shippingHint")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/">{t("cart.continueShopping")}</Link>
            </Button>
            <Button variant="destructive" onClick={() => dispatch(clearCart())}>
              {t("cart.clearCart")}
            </Button>
            <Button asChild>
              <Link to="/shipping">{t("cart.checkout")}</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

export default CartPage;
