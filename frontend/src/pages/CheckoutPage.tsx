import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createOrder } from "@/api/orders";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import { cartItemsToOrderItems } from "@/lib/cart-to-order";
import { formatCurrency } from "@/lib/format-currency";
import { useAppSelector } from "@/store/hooks";
import { selectCartItems, selectCartOrderTotals } from "@/store/cartSelectors";

function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useAppSelector((state) => state.ui.language);
  const items = useAppSelector(selectCartItems);
  const totals = useAppSelector(selectCartOrderTotals);
  const shippingAddress = useAppSelector((state) => state.cart.shippingAddress);
  const paymentMethod = useAppSelector(
    (state) => state.cart.selectedPaymentMethod,
  );

  const mutation = useMutation({
    mutationFn: () =>
      createOrder(
        {
          orderItems: cartItemsToOrderItems(items),
          shippingAddress: shippingAddress!,
          paymentMethod: paymentMethod!,
        },
        locale,
      ),
    onSuccess: (data) => {
      toast.success(data.message || t("checkout.orderCreated"));
      navigate(`/order/${data.createdOrder.id}`, { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t("checkout.orderFailed");
      toast.error(message);
    },
  });

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  if (!shippingAddress) {
    return <Navigate to="/shipping" replace />;
  }

  if (!paymentMethod) {
    return <Navigate to="/payment" replace />;
  }

  return (
    <section className="space-y-6">
      <CheckoutStepper />
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("checkout.title")}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("checkout.shipping")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{shippingAddress.address}</p>
              <p>
                {shippingAddress.code} {shippingAddress.city}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/shipping">{t("checkout.edit")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("checkout.payment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{paymentMethod}</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/payment">{t("checkout.edit")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("checkout.items")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between gap-4 border-b pb-2 last:border-0"
                >
                  <span>
                    {item.title ?? t("cart.product")} × {item.quantity}
                  </span>
                  <span>
                    {item.price != null
                      ? formatCurrency(item.price * item.quantity)
                      : "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("checkout.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("cart.subtotal")}
              </span>
              <span>{formatCurrency(totals.itemsPrice)}</span>
            </div>
            {totals.taxPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("order.tax")}</span>
                <span>{formatCurrency(totals.taxPrice)}</span>
              </div>
            )}
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
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>{t("cart.total")}</span>
              <span>{formatCurrency(totals.totalPrice)}</span>
            </div>

            <Button
              className="mt-4 w-full"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending
                ? t("checkout.placingOrder")
                : t("checkout.placeOrder")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default CheckoutPage;
