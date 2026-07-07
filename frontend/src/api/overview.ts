import { apiGet } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";
import type { OverviewData } from "@/types/overview";

export function fetchOverview(
  locale: AppLocale,
  signal?: AbortSignal
): Promise<OverviewData> {
  return apiGet<OverviewData>("overview", { locale, auth: true, signal });
}
