import { apiPost } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";

export type ContactMessageInput = {
  email: string;
  text: string;
};

export type ContactMessageResponse = {
  message: string;
};

export function sendContactMessage(
  body: ContactMessageInput,
  locale: AppLocale
): Promise<ContactMessageResponse> {
  return apiPost<ContactMessageResponse>("contact", body, { locale });
}
