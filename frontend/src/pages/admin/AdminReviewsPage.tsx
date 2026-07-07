import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteReview, fetchAdminReviews } from "@/api/reviews";
import AdminPagination from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import { formatDateTime, formatOrderId } from "@/lib/format-date";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";
import type { AdminReview } from "@/types/review";

function AdminReviewRow({
  review,
  onDelete,
  isDeleting,
}: {
  review: AdminReview;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  const authorName =
    review.User?.name ?? review.userName ?? t("admin.reviews.deletedUser");
  const productTitle =
    review.Product?.title ?? t("admin.reviews.deletedProduct");

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 text-sm">{authorName}</td>
      <td className="px-4 py-3 text-sm">
        {review.Product?.id ? (
          <Link
            to={`/product/${review.Product.id}`}
            className="text-primary hover:underline"
          >
            {productTitle}
          </Link>
        ) : (
          productTitle
        )}
      </td>
      <td className="px-4 py-3 font-mono text-sm">
        {formatOrderId(review.id)}
      </td>
      <td className="px-4 py-3 text-center text-sm">
        {formatDateTime(review.createdAt).slice(0, 17)}
      </td>
      <td className="px-4 py-3 text-center text-sm">{review.title}</td>
      <td className="max-w-xs truncate px-4 py-3 text-center text-sm">
        {review.description}
      </td>
      <td className="px-4 py-3 text-center text-sm">{review.rate}</td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="destructive"
          size="sm"
          disabled={isDeleting}
          onClick={() => onDelete(review.id)}
        >
          <Trash2 className="size-4" />
          {t("admin.reviews.delete")}
        </Button>
      </td>
    </tr>
  );
}

function AdminReviewsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const { pageNumber } = useParams<{ pageNumber?: string }>();
  const currentPage = Math.max(1, Number(pageNumber) || 1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.reviews(locale, currentPage),
    queryFn: async ({ signal }) => {
      try {
        return await fetchAdminReviews(currentPage, locale, signal);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return { reviews: [], pages: 0 };
        }
        throw err;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.reviews.deleteFailed");
      toast.error(message);
    },
  });

  const handleDelete = (reviewId: string) => {
    if (!window.confirm(t("admin.reviews.deleteConfirm"))) return;
    deleteMutation.mutate(reviewId);
  };

  if (isLoading) {
    return (
      <p className="text-muted-foreground">{t("admin.reviews.loading")}</p>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  const reviews = data?.reviews ?? [];
  const pages = data?.pages ?? 0;

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("admin.reviews.title")}</h2>
        <p className="text-muted-foreground">{t("admin.reviews.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("admin.reviews.title")}</h2>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">
                {t("admin.reviews.user")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("admin.reviews.product")}
              </th>
              <th className="px-4 py-3 font-medium">{t("admin.reviews.id")}</th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.reviews.date")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.reviews.reviewTitle")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.reviews.description")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.reviews.rating")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("admin.reviews.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <AdminReviewRow
                key={review.id}
                review={review}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        pages={pages}
        basePath="/admin/reviews"
        currentPage={currentPage}
      />
    </div>
  );
}

export default AdminReviewsPage;
