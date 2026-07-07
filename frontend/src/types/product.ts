import type { ProductReview } from "@/types/review";

export type Product = {
  id: string;
  title: string;
  description: string;
  images: string[];
  banners?: string[];
  price: number;
  category: string;
  countInStock: number;
  rating: number;
  numReviews: number;
  isFeatured?: boolean;
};

export type ProductDetail = Product & {
  ProductReviews?: ProductReview[];
};

export type ProductsResponse = {
  products: Product[];
  pages: number;
};
