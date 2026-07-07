export type ProductReview = {
  id: string;
  title: string;
  description: string;
  rate: number;
  userName: string;
  createdAt: string;
};

export type UserReview = ProductReview & {
  Product?: {
    id: string;
    title: string;
  } | null;
};

export type AdminReview = ProductReview & {
  User?: {
    id: string;
    name: string;
  } | null;
  Product?: {
    id: string;
    title: string;
  } | null;
};

export type AdminReviewsResponse = {
  reviews: AdminReview[];
  pages: number;
};

export type CreateProductReviewInput = {
  title: string;
  description: string;
  rate: number;
};
