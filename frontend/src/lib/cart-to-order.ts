import type { CartItem } from "@/store/cartSlice";
import type { CreateOrderInput } from "@/types/order";

export function cartItemsToOrderItems(items: CartItem[]): CreateOrderInput["orderItems"] {
  return items.map((item) => ({
    id: item.productId,
    title: item.title ?? "Product",
    images: item.imageUrl ? [item.imageUrl] : [],
    quantity: item.quantity,
  }));
}
