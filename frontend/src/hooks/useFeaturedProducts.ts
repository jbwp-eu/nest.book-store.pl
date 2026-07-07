import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedProducts } from "@/api/products";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

export function useFeaturedProducts() {
  const locale = useAppSelector((state) => state.ui.language);

  return useQuery({
    queryKey: queryKeys.products.featured(locale),
    queryFn: ({ signal }) => fetchFeaturedProducts(locale, signal),
  });
}
