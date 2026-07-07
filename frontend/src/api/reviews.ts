import { apiDelete, apiGet } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";
import type { AdminReviewsResponse, UserReview } from "@/types/review";

export function fetchMyReviews(
  locale: AppLocale,
  signal?: AbortSignal
): Promise<UserReview[]> {
  return apiGet<UserReview[]>("reviews/mine", { locale, auth: true, signal });
}

export function fetchAdminReviews(
  pageNumber: number,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<AdminReviewsResponse> {
  return apiGet<AdminReviewsResponse>(`reviews?pageNumber=${pageNumber}`, {
    locale,
    auth: true,
    signal,
  });
}

export function deleteReview(
  reviewId: string,
  locale: AppLocale
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`reviews/${reviewId}`, {
    locale,
    auth: true,
  });
}
