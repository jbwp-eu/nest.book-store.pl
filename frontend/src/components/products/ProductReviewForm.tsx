import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createProductReview } from "@/api/products";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

type ProductReviewFormProps = {
  productId: string;
};

function ProductReviewForm({ productId }: ProductReviewFormProps) {
  const { t } = useTranslation();
  const locale = useAppSelector((state) => state.ui.language);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState(0);

  const mutation = useMutation({
    mutationFn: () =>
      createProductReview(
        productId,
        { title: title.trim(), description: description.trim(), rate },
        locale,
      ),
    onSuccess: async () => {
      toast.success(t("productDetail.reviewSubmitted"));
      setTitle("");
      setDescription("");
      setRate(0);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(locale, productId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all }),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t("error.unknown");
      toast.error(message);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || rate < 1) return;
    mutation.mutate();
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-4">
      <p className="font-medium">{t("productDetail.writeReview")}</p>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="review-rate">
          {t("productDetail.reviewRate")}
        </label>
        <div className="flex items-center gap-1" id="review-rate">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                aria-label={t("productDetail.rateStar", { count: value })}
                onClick={() => setRate(value)}
                className="rounded p-0.5"
              >
                <Star
                  className={cn(
                    "size-6",
                    value <= rate
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="review-title">
          {t("productDetail.reviewTitle")}
        </label>
        <input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="review-description">
          {t("productDetail.reviewDescription")}
        </label>
        <textarea
          id="review-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cn(inputClass, "min-h-24 resize-y")}
          maxLength={500}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={
          mutation.isPending || !title.trim() || !description.trim() || rate < 1
        }
      >
        {mutation.isPending
          ? t("productDetail.reviewSubmitting")
          : t("productDetail.reviewSubmit")}
      </Button>
    </form>
  );
}

export default ProductReviewForm;
