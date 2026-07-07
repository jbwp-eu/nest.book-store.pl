import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteReview, fetchMyReviews } from "@/api/reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import { getAuthToken } from "@/lib/auth-token";
import { formatDateTime, formatOrderId } from "@/lib/format-date";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";
import type { UserReview } from "@/types/review";

function MyReviewCard({
  review,
  onDelete,
  isDeleting,
}: {
  review: UserReview;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  const productTitle =
    review.Product?.title ?? t("myReviews.deletedProduct");

  return (
    <Card>
      <CardContent className="space-y-3 pt-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {review.Product?.id ? (
              <Link
                to={`/product/${review.Product.id}`}
                className="font-medium text-primary hover:underline"
              >
                {productTitle}
              </Link>
            ) : (
              <p className="font-medium">{productTitle}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(review.createdAt).slice(0, 17)} ·{" "}
              {t("myReviews.rating")}: {review.rate}/5
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(review.id)}
          >
            <Trash2 className="size-4" />
            {t("myReviews.delete")}
          </Button>
        </div>
        <div>
          <p className="font-medium">{review.title}</p>
          <p className="text-muted-foreground">{review.description}</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {t("myReviews.id")}: {formatOrderId(review.id)}
        </p>
      </CardContent>
    </Card>
  );
}

function MyReviewsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const token = getAuthToken();
  const isAuthenticated = Boolean(token && token !== "EXPIRED");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.reviews.mine(
      locale,
      isAuthenticated ? token : null,
    ),
    queryFn: async ({ signal }) => {
      try {
        return await fetchMyReviews(locale, signal);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return [];
        }
        throw err;
      }
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("myReviews.deleteFailed");
      toast.error(message);
    },
  });

  const handleDelete = (reviewId: string) => {
    if (!window.confirm(t("myReviews.deleteConfirm"))) return;
    deleteMutation.mutate(reviewId);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">{t("myReviews.loading")}</p>;
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  const reviews = data ?? [];

  if (reviews.length === 0) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("myReviews.title")}
        </h1>
        <p className="text-muted-foreground">{t("myReviews.empty")}</p>
        <Button asChild>
          <Link to="/">{t("cart.continueShopping")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("myReviews.title")}
      </h1>
      <div className="space-y-4">
        {reviews.map((review) => (
          <MyReviewCard
            key={review.id}
            review={review}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </section>
  );
}

export default MyReviewsPage;
