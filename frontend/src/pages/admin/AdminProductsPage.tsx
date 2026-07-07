import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  createSampleProduct,
  deleteProduct,
  fetchProducts,
} from "@/api/products";
import AdminPagination from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderId } from "@/lib/format-date";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";
import type { Product } from "@/types/product";

function AdminProductRow({
  product,
  onDelete,
  isDeleting,
}: {
  product: Product;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 font-mono text-sm">{formatOrderId(product.id)}</td>
      <td className="px-4 py-3 text-center text-sm">{product.title}</td>
      <td className="px-4 py-3 text-center text-sm">{product.category}</td>
      <td className="px-4 py-3 text-center text-sm">
        {formatCurrency(Number(product.price))}
      </td>
      <td className="px-4 py-3 text-center text-sm">{product.countInStock}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/admin/products/${product.id}/edit`}>
              <Pencil className="size-4" />
              {t("admin.products.edit")}
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="size-4" />
            {t("admin.products.delete")}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AdminProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const { pageNumber } = useParams<{ pageNumber?: string }>();
  const currentPage = Math.max(1, Number(pageNumber) || 1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.products(locale, currentPage),
    queryFn: ({ signal }) =>
      fetchProducts({ pageNumber: String(currentPage) }, locale, signal),
  });

  const invalidateAndNavigate = (pages: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    const targetPage = pages > 0 ? pages : 1;
    if (targetPage === 1) {
      navigate("/admin/products");
    } else {
      navigate(`/admin/products/page/${targetPage}`);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => createSampleProduct(locale),
    onSuccess: (result) => {
      toast.success(result.message);
      invalidateAndNavigate(result.pages);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.products.createFailed");
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      invalidateAndNavigate(result.pages);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.products.deleteFailed");
      toast.error(message);
    },
  });

  const handleDelete = (productId: string) => {
    if (!window.confirm(t("admin.products.deleteConfirm"))) return;
    deleteMutation.mutate(productId);
  };

  if (isLoading) {
    return (
      <p className="text-muted-foreground">{t("admin.products.loading")}</p>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  const products = data?.products ?? [];
  const pages = data?.pages ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("admin.products.title")}</h2>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus className="size-4" />
          {t("admin.products.create")}
        </Button>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">{t("admin.products.empty")}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">
                    {t("admin.products.id")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    {t("admin.products.name")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    {t("admin.products.category")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    {t("admin.products.price")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    {t("admin.products.stock")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("admin.products.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <AdminProductRow
                    key={product.id}
                    product={product}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            pages={pages}
            basePath="/admin/products"
            currentPage={currentPage}
          />
        </>
      )}
    </div>
  );
}

export default AdminProductsPage;
