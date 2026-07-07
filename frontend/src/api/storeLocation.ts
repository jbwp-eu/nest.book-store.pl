import { apiGet } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";
import type { StoreLocation } from "@/types/storeLocation";

export function fetchStoreLocation(
  locale: AppLocale,
): Promise<StoreLocation> {
  return apiGet<StoreLocation>("store-location", { locale });
}
