import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getShippingSchema,
  type ShippingFormValues,
} from "@/lib/checkout-schemas";
import { formatCurrency } from "@/lib/format-currency";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCartItems, selectCartOrderTotals } from "@/store/cartSelectors";
import { setShippingAddress } from "@/store/cartSlice";

function ShippingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totals = useAppSelector(selectCartOrderTotals);
  const savedAddress = useAppSelector((state) => state.cart.shippingAddress);

  const schema = useMemo(() => getShippingSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver,
    defaultValues: savedAddress ?? { address: "", city: "", code: "" },
  });

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const onSubmit = (values: ShippingFormValues) => {
    dispatch(
      setShippingAddress({
        address: values.address.trim(),
        city: values.city.trim(),
        code: values.code.trim(),
      })
    );
    navigate("/payment");
  };

  return (
    <section className="space-y-6">
      <CheckoutStepper />
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("shipping.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("shipping.orderSummary", {
          count: totals.itemsQuantity,
          amount: formatCurrency(totals.totalPrice),
        })}
      </p>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">{t("shipping.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t("shipping.address")}</Label>
              <Input
                id="address"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.address)}
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t("shipping.city")}</Label>
              <Input
                id="city"
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.city)}
                {...register("city")}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t("shipping.postalCode")}</Label>
              <Input
                id="code"
                autoComplete="postal-code"
                aria-invalid={Boolean(errors.code)}
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit">{t("shipping.continueToPayment")}</Button>
              <Button asChild variant="outline">
                <Link to="/cart">{t("shipping.backToCart")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default ShippingPage;
