import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProductReview } from "@/types/review";
import { cn } from "@/lib/utils";

type ProductReviewListProps = {
  reviews: ProductReview[];
};

function StarRating({ value }: { value: number }) {
  const rounded = Math.round(Number(value));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rounded
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

function formatReviewDate(value: string, locale: string): string {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-GB" : "pl-PL");
}

function ProductReviewList({ reviews }: ProductReviewListProps) {
  const { t, i18n } = useTranslation();

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("productDetail.noReviews")}</p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{review.userName}</p>
            <time
              className="text-xs text-muted-foreground"
              dateTime={review.createdAt}
            >
              {formatReviewDate(review.createdAt, i18n.language)}
            </time>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <StarRating value={review.rate} />
            <span className="text-sm text-muted-foreground">
              {Number(review.rate).toFixed(0)}/5
            </span>
          </div>
          <p className="mb-1 font-medium">{review.title}</p>
          <p className="text-sm text-muted-foreground">{review.description}</p>
        </li>
      ))}
    </ul>
  );
}

export default ProductReviewList;
