import { type FormEvent, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { buildCatalogSearchUrl } from "@/lib/product-search-navigation";

function ProductSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pageNumber } = useParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) params.set("search", trimmed);
    else params.delete("search");
    const qs = params.toString();
    const base = pageNumber ? `/page/${pageNumber}` : buildCatalogSearchUrl("");
    navigate(qs ? `${base}?${qs}` : base);
  };

  return (
    <form onSubmit={onSubmit} className="mb-6 flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("search.placeholder")}
        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit" size="sm">
        {t("search.submit")}
      </Button>
    </form>
  );
}

export default ProductSearch;
