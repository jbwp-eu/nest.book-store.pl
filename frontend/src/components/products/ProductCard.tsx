import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";
import { resolveProductImageUrl } from "@/utils/imageUrl";
import { Star } from "lucide-react";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveProductImageUrl(product.images[0]);
  const price = Number(product.price);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="gap-3 p-0">
        <Link to={`/product/${product.id}`} className="block overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
              {t("productCard.noImage")}
            </div>
          )}
        </Link>
        <CardTitle className="line-clamp-2 px-4 text-base">
          <Link to={`/product/${product.id}`} className="hover:underline">
            {product.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span>{Number(product.rating).toFixed(1)}</span>
          <span>
            ({product.numReviews}{" "}
            {product.numReviews === 1
              ? t("productCard.review")
              : t("productCard.reviews")})
          </span>
        </div>
        {product.countInStock > 0 ? (
          <p className="font-medium">{formatCurrency(price)}</p>
        ) : (
          <p className="text-sm text-destructive">{t("productCard.outOfStock")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductCard;
