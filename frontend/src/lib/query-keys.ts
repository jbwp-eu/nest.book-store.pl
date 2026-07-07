export const queryKeys = {
  products: {
    all: ["products"] as const,
    featured: (locale: string) =>
      [...queryKeys.products.all, "featured", locale] as const,
    list: (locale: string, params: Record<string, string | undefined>) =>
      [...queryKeys.products.all, "list", locale, params] as const,
    detail: (locale: string, id: string) =>
      [...queryKeys.products.all, "detail", locale, id] as const,
  },
  users: {
    all: ["users"] as const,
    me: (locale: string, token: string | null) =>
      [...queryKeys.users.all, "me", locale, token] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    mine: (locale: string, token: string | null) =>
      [...queryKeys.reviews.all, "mine", locale, token] as const,
  },
  orders: {
    all: ["orders"] as const,
    mine: (locale: string) =>
      [...queryKeys.orders.all, "mine", locale] as const,
    detail: (locale: string, id: string) =>
      [...queryKeys.orders.all, "detail", locale, id] as const,
  },
  admin: {
    all: ["admin"] as const,
    overview: (locale: string) =>
      [...queryKeys.admin.all, "overview", locale] as const,
    orders: (locale: string, page: number) =>
      [...queryKeys.admin.all, "orders", locale, page] as const,
    products: (locale: string, page: number) =>
      [...queryKeys.admin.all, "products", locale, page] as const,
    users: (locale: string) =>
      [...queryKeys.admin.all, "users", locale] as const,
    userDetail: (locale: string, userId: string) =>
      [...queryKeys.admin.all, "users", "detail", locale, userId] as const,
    reviews: (locale: string, page: number) =>
      [...queryKeys.admin.all, "reviews", locale, page] as const,
  },
  storeLocation: {
    all: ["storeLocation"] as const,
    detail: (locale: string) =>
      [...queryKeys.storeLocation.all, locale] as const,
  },
};
