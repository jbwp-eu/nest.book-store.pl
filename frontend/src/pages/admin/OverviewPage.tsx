import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  Barcode,
  Package,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchOverview } from "@/api/overview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
};

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function OverviewPage() {
  const { t } = useTranslation();
  const locale = useAppSelector((state) => state.ui.language);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.overview(locale),
    queryFn: ({ signal }) => fetchOverview(locale, signal),
  });

  if (isLoading) {
    return <p className="text-muted-foreground">{t("admin.overview.loading")}</p>;
  }

  if (isError || !data) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("admin.overview.title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t("admin.overview.revenue")}
          value={formatCurrency(Number(data.totalSales))}
          icon={<BadgeDollarSign className="size-4" />}
        />
        <StatCard
          title={t("admin.overview.products")}
          value={data.productsCount}
          icon={<Barcode className="size-4" />}
        />
        <StatCard
          title={t("admin.overview.orders")}
          value={data.ordersCount}
          icon={<Package className="size-4" />}
        />
        <StatCard
          title={t("admin.overview.customers")}
          value={data.usersCount}
          icon={<Users className="size-4" />}
        />
        <StatCard
          title={t("admin.overview.reviews")}
          value={data.reviewsCount}
          icon={<Star className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("admin.overview.salesChart")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.salesData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("admin.overview.noSalesData")}
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.salesData.map((point) => (
                  <li
                    key={point.Date}
                    className="flex items-center justify-between gap-4 border-b pb-2 last:border-0"
                  >
                    <span className="text-muted-foreground">{point.Date}</span>
                    <span className="font-medium">
                      {formatCurrency(point.Total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("admin.overview.recentOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("admin.overview.noOrders")}
              </p>
            ) : (
              <div className="space-y-3">
                {data.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {order.User?.name ?? t("admin.overview.deletedCustomer")}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {formatCurrency(Number(order.totalPrice))}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/order/${order.id}`}>
                          {t("admin.overview.details")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OverviewPage;
