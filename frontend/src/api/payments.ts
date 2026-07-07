import { apiPost } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";

export type CreatePaymentIntentInput = {
  id: string;
  amount: number;
};

export type CreatePaymentIntentResponse = {
  clientSecret: string;
};

export function createPaymentIntent(
  body: CreatePaymentIntentInput,
  locale: AppLocale
): Promise<CreatePaymentIntentResponse> {
  return apiPost<CreatePaymentIntentResponse>("create-payment-intent", body, {
    locale,
  });
}
