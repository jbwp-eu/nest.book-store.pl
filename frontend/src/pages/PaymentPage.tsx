import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCartItems, selectCartOrderTotals } from "@/store/cartSelectors";
import { setPaymentMethod } from "@/store/cartSlice";

function PaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totals = useAppSelector(selectCartOrderTotals);
  const shippingAddress = useAppSelector((state) => state.cart.shippingAddress);
  const selectedMethod = useAppSelector(
    (state) => state.cart.selectedPaymentMethod
  );

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  if (!shippingAddress) {
    return <Navigate to="/shipping" replace />;
  }

  const handleContinue = () => {
    dispatch(setPaymentMethod("Stripe"));
    navigate("/checkout");
  };

  return (
    <section className="space-y-6">
      <CheckoutStepper />
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("payment.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("payment.orderSummary", {
          count: totals.itemsQuantity,
          amount: formatCurrency(totals.totalPrice),
        })}
      </p>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">{t("payment.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
            <input
              type="radio"
              name="paymentMethod"
              value="Stripe"
              checked={selectedMethod === "Stripe" || !selectedMethod}
              onChange={() => dispatch(setPaymentMethod("Stripe"))}
              className="size-4"
            />
            <div>
              <p className="font-medium">{t("payment.stripe")}</p>
              <p className="text-sm text-muted-foreground">
                {t("payment.stripeDesc")}
              </p>
            </div>
          </label>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleContinue}>{t("payment.continueToReview")}</Button>
            <Button asChild variant="outline">
              <Link to="/shipping">{t("payment.backToShipping")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default PaymentPage;
