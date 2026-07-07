import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProductFilterUrl } from "@/hooks/useProductFilterUrl";
import { cn } from "@/lib/utils";

const sortOrders = [
  { value: "ascending", labelKey: "sort.ascending" },
  { value: "descending", labelKey: "sort.descending" },
] as const;

const sortCategories = [
  { value: "title", labelKey: "sort.categoryTitle" },
  { value: "price", labelKey: "sort.categoryPrice" },
  { value: "rating", labelKey: "sort.categoryRating" },
] as const;

type ProductSortProps = {
  order?: string;
  category?: string;
};

function ProductSort({ order = "", category = "" }: ProductSortProps) {
  const { t } = useTranslation();
  const { getFilterUrl, clearFiltersUrl } = useProductFilterUrl();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{t("sort.label")}</span>
        {sortOrders.map((o) => (
          <Link
            key={o.value}
            to={getFilterUrl({ order: o.value })}
            className={cn(order === o.value && "font-semibold text-foreground")}
          >
            {t(o.labelKey)}
          </Link>
        ))}
        {sortCategories.map((c) => (
          <Link
            key={c.value}
            to={getFilterUrl({ category: c.value })}
            className={cn(category === c.value && "font-semibold text-foreground")}
          >
            {t(c.labelKey)}
          </Link>
        ))}
      </div>
      <Link to={clearFiltersUrl} className="font-semibold hover:underline">
        {t("sort.clear")}
      </Link>
    </div>
  );
}

export default ProductSort;
