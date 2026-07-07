import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProductFilterUrl } from "@/hooks/useProductFilterUrl";
import { cn } from "@/lib/utils";

const ratings = ["any", "4", "3", "2", "1"] as const;
const prices = ["any", "0-25", "25-50", "50-75", "75-100", "100-200"] as const;

type ProductFiltersProps = {
  rating?: string;
  price?: string;
};

function ProductFilters({ rating = "any", price = "any" }: ProductFiltersProps) {
  const { t, i18n } = useTranslation();
  const { getFilterUrl } = useProductFilterUrl();
  const isEn = i18n.language === "en";

  return (
    <aside className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-8 gap-y-6 text-sm md:grid-cols-1 md:gap-y-8">
      <div className="space-y-2">
        <p className="font-semibold">{t("filter.ratings")}</p>
        {ratings.map((r) => (
          <Link
            key={r}
            to={getFilterUrl({ rating: r })}
            className={cn(
              "flex items-center gap-1 hover:text-foreground",
              rating === r && "font-semibold text-foreground"
            )}
          >
            {!isEn && r !== "any" && t("filter.minPrefix")}{" "}
            {r === "any" ? t("filter.ratingAny") : r}{" "}
            {r !== "any" && "★"}
            {isEn && r !== "any" && ` ${t("filter.andUp")}`}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <p className="font-semibold">{t("filter.price")}</p>
        {prices.map((p) => (
          <Link
            key={p}
            to={getFilterUrl({ price: p })}
            className={cn(
              "block hover:text-foreground",
              price === p && "font-semibold text-foreground"
            )}
          >
            {p === "any" ? t("filter.priceAny") : p.replace("-", " – ")}
            {p !== "any" && " zł"}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default ProductFilters;
