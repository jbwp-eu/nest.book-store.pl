export type OrderItem = {
  id: string;
  title: string;
  images: string[];
  quantity: number;
  product: string;
  price: number | string;
};

export type Order = {
  id: string;
  shippingAddress: {
    address: string;
    city: string;
    code: string;
  };
  paymentMethod: string;
  itemsPrice: number | string;
  shippingPrice: number | string;
  taxPrice: number | string;
  totalPrice: number | string;
  isPaid: boolean;
  paidAt: string | null;
  isDelivered: boolean;
  deliveredAt: string | null;
  OrderItems: OrderItem[];
  createdAt: string;
  User?: {
    id: string;
    name: string;
    email?: string;
  };
};

export type AdminOrdersResponse = {
  orders: Order[];
  pages: number;
};

export type CreateOrderInput = {
  orderItems: {
    id: string;
    title: string;
    images: string[];
    quantity: number;
  }[];
  shippingAddress: {
    address: string;
    city: string;
    code: string;
  };
  paymentMethod: string;
};

export type CreateOrderResponse = {
  message: string;
  createdOrder: Order;
};
