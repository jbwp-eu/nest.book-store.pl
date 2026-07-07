import { apiGet } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";
import type { ChatMessage } from "@/types/chat";

export function fetchChatMessages(
  orderId: string,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<ChatMessage[]> {
  return apiGet<ChatMessage[]>(`orders/${orderId}/chat-messages`, {
    locale,
    auth: true,
    signal,
  });
}
