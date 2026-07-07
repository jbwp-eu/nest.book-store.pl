import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchProduct } from "@/api/products";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

export function useProduct() {
  const locale = useAppSelector((state) => state.ui.language);
  const { id } = useParams();

  return useQuery({
    queryKey: queryKeys.products.detail(locale, id ?? ""),
    queryFn: ({ signal }) => {
      if (!id) throw new Error("Missing product id");
      return fetchProduct(id, locale, signal);
    },
    enabled: Boolean(id),
  });
}
