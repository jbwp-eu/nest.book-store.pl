import { apiDelete, apiGet, apiPatchFormData, apiPost } from "@/lib/apiClient";
import type { UpdateProductResponse } from "@/lib/product-edit-schema";
import type { AppLocale } from "@/lib/locale";
import type { ProductsQueryParams } from "@/lib/product-query";
import type { Product, ProductDetail, ProductsResponse } from "@/types/product";
import type { CreateProductReviewInput } from "@/types/review";

export type { Product, ProductDetail, ProductsResponse };

export function fetchFeaturedProducts(
  locale: AppLocale,
  signal?: AbortSignal
): Promise<Product[]> {
  return apiGet<Product[]>("products/featured", { locale, signal });
}

export function fetchProducts(
  params: ProductsQueryParams,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const qs = new URLSearchParams();
  qs.set("pageNumber", params.pageNumber);
  if (params.rating && params.rating !== "any") qs.set("rating", params.rating);
  if (params.price && params.price !== "any") qs.set("price", params.price);
  if (params.order) qs.set("order", params.order);
  if (params.category) qs.set("category", params.category);
  if (params.search?.trim()) qs.set("search", params.search.trim());

  return apiGet<ProductsResponse>(`products?${qs.toString()}`, {
    locale,
    signal,
  });
}

export function fetchProduct(
  id: string,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<ProductDetail> {
  return apiGet<ProductDetail>(`products/${id}`, { locale, signal });
}

export function createProductReview(
  productId: string,
  body: CreateProductReviewInput,
  locale: AppLocale
): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`products/${productId}/reviews`, body, {
    locale,
    auth: true,
  });
}

export function createSampleProduct(
  locale: AppLocale
): Promise<{ message: string; pages: number }> {
  return apiPost<{ message: string; pages: number }>("products", undefined, {
    locale,
    auth: true,
  });
}

export function deleteProduct(
  productId: string,
  locale: AppLocale
): Promise<{ message: string; pages: number }> {
  return apiDelete<{ message: string; pages: number }>(
    `products/${productId}`,
    { locale, auth: true }
  );
}

export function updateProduct(
  productId: string,
  formData: FormData,
  locale: AppLocale
): Promise<UpdateProductResponse> {
  return apiPatchFormData<UpdateProductResponse>(
    `products/${productId}`,
    formData,
    { locale, auth: true }
  );
}
