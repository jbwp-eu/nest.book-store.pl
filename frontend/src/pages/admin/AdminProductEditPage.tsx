import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fetchProduct, updateProduct } from "@/api/products";
import ProductEditForm, {
  type FileUploads,
} from "@/components/admin/ProductEditForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import type { ProductEditFormValues } from "@/lib/product-edit-schema";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

function buildFormData(
  values: ProductEditFormValues,
  files: FileUploads
): FormData {
  const formData = new FormData();
  formData.append("title", values.title);
  formData.append("description", values.description);
  formData.append("category", values.category);
  formData.append("price", String(values.price));
  formData.append("countInStock", String(values.countInStock));
  formData.append("isFeatured", String(values.isFeatured));

  files.images.forEach((file) => formData.append("images", file));
  files.banners.forEach((file) => formData.append("banners", file));

  return formData;
}

function AdminProductEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const { id } = useParams<{ id: string }>();

  const productId = id ?? "";

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.products.detail(locale, productId),
    queryFn: ({ signal }) => fetchProduct(productId, locale, signal),
    enabled: Boolean(productId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { values: ProductEditFormValues; files: FileUploads }) =>
      updateProduct(productId, buildFormData(payload.values, payload.files), locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      const targetPage = result.page > 0 ? result.page : 1;
      navigate(
        targetPage === 1
          ? "/admin/products"
          : `/admin/products/page/${targetPage}`
      );
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.productEdit.saveFailed");
      toast.error(message);
    },
  });

  const backLink = useMemo(() => "/admin/products", []);

  if (isLoading) {
    return (
      <p className="text-muted-foreground">{t("admin.productEdit.loading")}</p>
    );
  }

  if (isError || !product) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return (
      <section className="space-y-4">
        <p className="text-destructive">{message}</p>
        <Button asChild variant="outline">
          <Link to={backLink}>{t("admin.productEdit.back")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="outline">
        <Link to={backLink}>{t("admin.productEdit.back")}</Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          <ProductEditForm
            product={product}
            isSubmitting={updateMutation.isPending}
            onSubmit={(values, files) =>
              updateMutation.mutate({ values, files })
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}

export default AdminProductEditPage;
