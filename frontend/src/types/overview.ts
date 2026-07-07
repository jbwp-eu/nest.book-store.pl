export type OverviewOrder = {
  id: string;
  totalPrice: number | string;
  createdAt: string;
  User?: {
    id: string;
    name: string;
  } | null;
};

export type OverviewSalesPoint = {
  Date: string;
  Total: number;
};

export type OverviewData = {
  productsCount: number;
  usersCount: number;
  ordersCount: number;
  reviewsCount: number;
  totalSales: number | string;
  orders: OverviewOrder[];
  salesData: OverviewSalesPoint[];
};
