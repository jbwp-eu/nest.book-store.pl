import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchProducts } from "@/api/products";
import { parseProductsQuery } from "@/lib/product-query";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

export function useProducts() {
  const locale = useAppSelector((state) => state.ui.language);
  const [searchParams] = useSearchParams();
  const { pageNumber } = useParams();

  const queryParams = useMemo(
    () => parseProductsQuery(pageNumber, searchParams),
    [pageNumber, searchParams]
  );

  return useQuery({
    queryKey: queryKeys.products.list(locale, queryParams),
    queryFn: ({ signal }) => fetchProducts(queryParams, locale, signal),
    // placeholderData: keepPreviousData sprawia, że podczas ponownego pobierania danych (np. zmiany strony lub filtrów)
    // zamiast pokazywać pusty stan lub spinner, komponent zachowuje dane z poprzedniego zapytania,
    // aż do załadowania nowych wyników. Dzięki temu lista produktów nie "znika" i przejście jest płynniejsze dla użytkownika.
    placeholderData: keepPreviousData,
  });
}
