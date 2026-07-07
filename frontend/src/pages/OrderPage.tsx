import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createPaymentIntent } from "@/api/payments";
import { fetchOrder, markOrderDelivered } from "@/api/orders";
import StripeCheckout from "@/components/checkout/StripeCheckout";
import OrderChat from "@/components/orders/OrderChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format-currency";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart } from "@/store/cartSlice";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { queryKeys } from "@/lib/query-keys";

function OrderPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const locale = useAppSelector((state) => state.ui.language);
  const { data: currentUser } = useCurrentUser();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const paymentIntentFetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.orders.detail(locale, id!),
    queryFn: ({ signal }) => fetchOrder(id!, locale, signal),
    enabled: Boolean(id),
    // refetchInterval ustawia, jak często react-query ma ponawiać zapytanie do API.
    // Funkcja ta sprawdza, czy zamówienie zostało opłacone metodą Stripe.
    // Jeśli zamówienie ma paymentMethod "Stripe" i nie jest jeszcze opłacone (isPaid === false),
    // to zapytanie będzie odświeżane co 3000 ms (czyli co 3 sekundy).
    // Dzięki temu frontend regularnie sprawdza, czy płatność Stripe została zakończona,
    // i pobiera najnowszy status zamówienia z backendu.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.paymentMethod === "Stripe" && !data.isPaid) {
        return 3000;
      }
      return false;
    },
  });

  const orderId = order?.id;
  const orderIsPaid = order?.isPaid;
  const orderPaymentMethod = order?.paymentMethod;
  const orderTotalPrice = order ? Number(order.totalPrice) : null;

  useEffect(() => {
    if (
      !orderId ||
      orderIsPaid ||
      orderPaymentMethod !== "Stripe" ||
      orderTotalPrice == null
    ) {
      return;
    }
    if (clientSecret) return;
    if (paymentIntentFetchedForRef.current === orderId) return;

    const resolvedOrderId = orderId;
    const resolvedTotalPrice = orderTotalPrice;
    paymentIntentFetchedForRef.current = resolvedOrderId;
    let cancelled = false;

    async function loadPaymentIntent() {
      try {
        setPaymentLoading(true);
        setPaymentError(null);
        const amount = Math.round(resolvedTotalPrice * 100);
        const response = await createPaymentIntent(
          { id: resolvedOrderId, amount },
          locale,
        );
        if (!cancelled) {
          setClientSecret(response.clientSecret);
        }
      } catch (err) {
        paymentIntentFetchedForRef.current = null;
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : t("stripe.error");
          setPaymentError(message);
        }
      } finally {
        if (!cancelled) {
          setPaymentLoading(false);
        }
      }
    }

    loadPaymentIntent();

    return () => {
      cancelled = true;
    };
  }, [
    orderId,
    orderIsPaid,
    orderPaymentMethod,
    orderTotalPrice,
    locale,
    clientSecret,
    t,
  ]);

  const deliverMutation = useMutation({
    mutationFn: () => markOrderDelivered(id!, locale),
    onSuccess: async (result) => {
      toast.success(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
      ]);
      await refetch();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("order.deliverFailed");
      toast.error(message);
    },
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.mine(locale) }),
    ]);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">{t("order.loading")}</p>;
  }

  if (isError || !order) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return (
      <section className="space-y-4 text-center">
        <p className="text-destructive">{message}</p>
        <Button asChild variant="outline">
          <Link to="/">{t("cart.back")}</Link>
        </Button>
      </section>
    );
  }

  const totalPrice = Number(order.totalPrice);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("order.title")} #{order.id.slice(0, 8)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {order.isPaid ? t("order.paid") : t("order.awaitingPayment")}
          {order.isPaid && (
            <>
              {" "}
              ·{" "}
              {order.isDelivered
                ? t("order.delivered")
                : t("order.notDelivered")}
            </>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("order.summary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.subtotal")}</span>
            <span>{formatCurrency(Number(order.itemsPrice))}</span>
          </div>
          {Number(order.taxPrice) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("order.tax")}</span>
              <span>{formatCurrency(Number(order.taxPrice))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.shipping")}</span>
            <span>{formatCurrency(Number(order.shippingPrice))}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>{t("cart.total")}</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("checkout.items")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.OrderItems.map((item) => (
            <div key={item.id} className="flex justify-between gap-4">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>
                {formatCurrency(Number(item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <OrderChat
        orderId={order.id}
        locale={locale}
        currentUserId={currentUser?.id}
      />

      {!order.isPaid &&
        order.paymentMethod === "Stripe" &&
        !currentUser?.isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("stripe.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentLoading && (
              <p className="text-sm text-muted-foreground">
                {t("stripe.loading")}
              </p>
            )}
            {paymentError && (
              <p className="text-sm text-destructive">{paymentError}</p>
            )}
            {!paymentLoading && clientSecret && (
              <StripeCheckout
                clientSecret={clientSecret}
                orderId={order.id}
                totalPrice={totalPrice}
              />
            )}
          </CardContent>
        </Card>
      )}

      {order.isPaid && (
        <div className="flex flex-wrap gap-3">
          {currentUser?.isAdmin && !order.isDelivered && (
            <Button
              onClick={() => deliverMutation.mutate()}
              disabled={deliverMutation.isPending}
            >
              {deliverMutation.isPending
                ? t("order.markingDelivered")
                : t("order.markAsDelivered")}
            </Button>
          )}
          {currentUser?.isAdmin ? (
            <Button asChild variant="outline">
              <Link to="/admin/orders">{t("admin.nav.orders")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link to="/">{t("cart.continueShopping")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/my-orders">{t("nav.myOrders")}</Link>
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => void handleRefresh()}>
            {t("order.refresh")}
          </Button>
        </div>
      )}
    </section>
  );
}

export default OrderPage;
