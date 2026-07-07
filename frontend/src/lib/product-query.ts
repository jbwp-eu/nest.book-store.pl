export type ProductsQueryParams = {
  pageNumber: string;
  rating?: string;
  price?: string;
  order?: string;
  category?: string;
  search?: string;
};

export function parseProductsQuery(
  pageNumber: string | undefined,
  searchParams: URLSearchParams
): ProductsQueryParams {
  return {
    pageNumber: pageNumber ?? searchParams.get("pageNumber") ?? "1",
    rating: searchParams.get("rating") ?? undefined,
    price: searchParams.get("price") ?? undefined,
    order: searchParams.get("order") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };
}

export function toSearchParams(
  params: ProductsQueryParams
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === "pageNumber") continue;
    if (value && value !== "any") out[key] = value;
  }
  return out;
}
