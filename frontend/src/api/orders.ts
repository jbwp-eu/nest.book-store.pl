import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";
import type {
  AdminOrdersResponse,
  CreateOrderInput,
  CreateOrderResponse,
  Order,
} from "@/types/order";

export function createOrder(
  body: CreateOrderInput,
  locale: AppLocale
): Promise<CreateOrderResponse> {
  return apiPost<CreateOrderResponse>("orders", body, { locale, auth: true });
}

export function fetchOrder(
  orderId: string,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<Order> {
  return apiGet<Order>(`orders/${orderId}`, { locale, auth: true, signal });
}

export function fetchMyOrders(
  locale: AppLocale,
  signal?: AbortSignal
): Promise<Order[]> {
  return apiGet<Order[]>("orders/mine", { locale, auth: true, signal });
}

export function fetchAdminOrders(
  pageNumber: number,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<AdminOrdersResponse> {
  return apiGet<AdminOrdersResponse>(`orders?pageNumber=${pageNumber}`, {
    locale,
    auth: true,
    signal,
  });
}

export function deleteOrder(
  orderId: string,
  locale: AppLocale
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`orders/${orderId}`, {
    locale,
    auth: true,
  });
}

export function markOrderDelivered(
  orderId: string,
  locale: AppLocale
): Promise<{ message: string }> {
  return apiPut<{ message: string }>(`orders/${orderId}/deliver`, undefined, {
    locale,
    auth: true,
  });
}
