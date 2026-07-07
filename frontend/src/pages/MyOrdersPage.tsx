import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchMyOrders } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime, formatOrderId } from "@/lib/format-date";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";
import type { Order } from "@/types/order";

function OrderStatusCell({
  done,
  date,
}: {
  done: boolean;
  date: string | null;
}) {
  if (done && date) {
    return <span>{formatDateTime(date)}</span>;
  }
  return (
    <span className="inline-flex justify-center">
      <X className="size-4 text-destructive" aria-hidden />
    </span>
  );
}

function OrderTableRow({ order }: { order: Order }) {
  const { t } = useTranslation();

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 font-mono text-sm">{formatOrderId(order.id)}</td>
      <td className="px-4 py-3 text-center text-sm">
        {formatDateTime(order.createdAt).slice(0, 17)}
      </td>
      <td className="px-4 py-3 text-center text-sm">
        {formatCurrency(Number(order.totalPrice))}
      </td>
      <td className="px-4 py-3 text-center text-sm">
        <OrderStatusCell done={order.isPaid} date={order.paidAt} />
      </td>
      <td className="px-4 py-3 text-center text-sm">
        <OrderStatusCell done={order.isDelivered} date={order.deliveredAt} />
      </td>
      <td className="px-4 py-3 text-right">
        <Button asChild variant="outline" size="sm">
          <Link to={`/order/${order.id}`}>{t("myOrders.details")}</Link>
        </Button>
      </td>
    </tr>
  );
}

function OrderMobileCard({ order }: { order: Order }) {
  const { t } = useTranslation();

  return (
    <Card className="mb-4 last:mb-0">
      <CardContent className="space-y-3 pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("myOrders.id")}</span>
          <span className="font-mono">{formatOrderId(order.id)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("myOrders.date")}</span>
          <span>{formatDateTime(order.createdAt).slice(0, 17)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("myOrders.total")}</span>
          <span>{formatCurrency(Number(order.totalPrice))}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("myOrders.paid")}</span>
          <OrderStatusCell done={order.isPaid} date={order.paidAt} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("myOrders.delivered")}</span>
          <OrderStatusCell
            done={order.isDelivered}
            date={order.deliveredAt}
          />
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/order/${order.id}`}>{t("myOrders.details")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MyOrdersPage() {
  const { t } = useTranslation();
  const locale = useAppSelector((state) => state.ui.language);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.orders.mine(locale),
    queryFn: async ({ signal }) => {
      try {
        return await fetchMyOrders(locale, signal);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return [];
        }
        throw err;
      }
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">{t("myOrders.loading")}</p>;
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  const orders = data ?? [];

  if (orders.length === 0) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("myOrders.title")}
        </h1>
        <p className="text-muted-foreground">{t("myOrders.empty")}</p>
        <Button asChild>
          <Link to="/">{t("cart.continueShopping")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("myOrders.title")}
      </h1>

      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">{t("myOrders.id")}</th>
              <th className="px-4 py-3 text-center font-medium">
                {t("myOrders.date")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("myOrders.total")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("myOrders.paid")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("myOrders.delivered")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("myOrders.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderTableRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        {orders.map((order) => (
          <OrderMobileCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}

export default MyOrdersPage;
