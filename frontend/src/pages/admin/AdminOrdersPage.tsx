import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Truck, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteOrder, fetchAdminOrders, markOrderDelivered } from "@/api/orders";
import AdminPagination from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
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

function AdminOrderRow({
  order,
  onDelete,
  onDeliver,
  isDeleting,
  isDelivering,
}: {
  order: Order;
  onDelete: (id: string) => void;
  onDeliver: (id: string) => void;
  isDeleting: boolean;
  isDelivering: boolean;
}) {
  const { t } = useTranslation();

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 font-mono text-sm">{formatOrderId(order.id)}</td>
      <td className="px-4 py-3 text-center text-sm">
        {order.User?.name ?? "—"}
      </td>
      <td className="px-4 py-3 text-center text-sm">
        {formatDateTime(order.createdAt)}
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
        <div className="flex flex-wrap justify-end gap-2">
          {!order.isDelivered && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isDelivering}
              onClick={() => onDeliver(order.id)}
            >
              <Truck className="size-4" />
              {t("admin.orders.markDelivered")}
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={`/order/${order.id}`}>{t("admin.orders.details")}</Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(order.id)}
          >
            <Trash2 className="size-4" />
            {t("admin.orders.delete")}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AdminOrdersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const { pageNumber } = useParams<{ pageNumber?: string }>();
  const currentPage = Math.max(1, Number(pageNumber) || 1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.orders(locale, currentPage),
    queryFn: async ({ signal }) => {
      try {
        return await fetchAdminOrders(currentPage, locale, signal);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return { orders: [], pages: 0 };
        }
        throw err;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.orders.deleteFailed");
      toast.error(message);
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => markOrderDelivered(orderId, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.orders.deliverFailed");
      toast.error(message);
    },
  });

  const handleDeliver = (orderId: string) => {
    deliverMutation.mutate(orderId);
  };

  const handleDelete = (orderId: string) => {
    if (!window.confirm(t("admin.orders.deleteConfirm"))) return;
    deleteMutation.mutate(orderId);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">{t("admin.orders.loading")}</p>;
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  const orders = data?.orders ?? [];
  const pages = data?.pages ?? 0;

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("admin.orders.title")}</h2>
        <p className="text-muted-foreground">{t("admin.orders.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("admin.orders.title")}</h2>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">{t("admin.orders.id")}</th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.orders.customer")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.orders.date")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.orders.total")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.orders.paid")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.orders.delivered")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("admin.orders.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <AdminOrderRow
                key={order.id}
                order={order}
                onDelete={handleDelete}
                onDeliver={handleDeliver}
                isDeleting={deleteMutation.isPending}
                isDelivering={deliverMutation.isPending}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        pages={pages}
        basePath="/admin/orders"
        currentPage={currentPage}
      />
    </div>
  );
}

export default AdminOrdersPage;
