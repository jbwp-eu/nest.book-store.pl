import { useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toSearchParams } from "@/lib/product-query";
import type { ProductsQueryParams } from "@/lib/product-query";

type FilterPatch = {
  order?: string;
  category?: string;
  rating?: string;
  price?: string;
  search?: string;
};

export function useProductFilterUrl() {
  const [searchParams] = useSearchParams();
  const { pageNumber } = useParams();

  const currentParams = Object.fromEntries(searchParams.entries());

  const buildPath = useCallback(
    (page: string, filterParams: Record<string, string>) => {
      const qs = new URLSearchParams(filterParams).toString();
      const pagePath = page === "1" ? "/" : `/page/${page}`;
      return qs ? `${pagePath}?${qs}` : pagePath;
    },
    []
  );

  const getFilterUrl = useCallback(
    (patch: FilterPatch) => {
      let next: ProductsQueryParams = {
        pageNumber: pageNumber ?? "1",
        ...currentParams,
      };

      if (patch.order) {
        next = { ...next, category: next.category ?? "title", order: patch.order };
      } else if (patch.category) {
        next = { ...next, order: next.order ?? "ascending", category: patch.category };
      } else if (patch.rating !== undefined) {
        next = {
          ...next,
          order: "ascending",
          category: "rating",
          rating: patch.rating,
        };
      } else if (patch.price !== undefined) {
        next = {
          ...next,
          order: "ascending",
          category: "price",
          price: patch.price,
        };
      }

      const page = pageNumber ?? "1";
      return buildPath(page, toSearchParams(next));
    },
    [buildPath, currentParams, pageNumber]
  );

  const getPageUrl = useCallback(
    (page: number) => {
      const next: ProductsQueryParams = {
        pageNumber: String(page),
        ...currentParams,
      };
      return buildPath(String(page), toSearchParams(next));
    },
    [buildPath, currentParams]
  );

  const clearFiltersUrl = pageNumber && pageNumber !== "1" ? `/page/${pageNumber}` : "/";

  return { getFilterUrl, getPageUrl, clearFiltersUrl, currentParams };
}
