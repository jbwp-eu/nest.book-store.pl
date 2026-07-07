import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format-currency";
import { getAuthToken } from "@/lib/auth-token";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProduct } from "@/hooks/useProduct";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem, removeItem } from "@/store/cartSlice";
import { resolveProductImageUrl } from "@/utils/imageUrl";
import ProductImages from "@/components/products/ProductImages";
import ProductReviewForm from "@/components/products/ProductReviewForm";
import ProductReviewList from "@/components/products/ProductReviewList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ProductDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: product, isLoading, isError, error } = useProduct();
  const { data: currentUser } = useCurrentUser();
  const inCart = useAppSelector((state) =>
    product
      ? state.cart.items.some((item) => item.productId === product.id)
      : false
  );

  const token = getAuthToken();
  const isAuthenticated = Boolean(token && token !== "EXPIRED");
  const reviews = product?.ProductReviews ?? [];
  const alreadyReviewed =
    Boolean(currentUser) &&
    reviews.some((review) => review.userName === currentUser?.name);

  if (isLoading) {
    return (
      <p className="text-muted-foreground">{t("productDetail.loading")}</p>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    const isNotFound = error instanceof ApiError && error.status === 404;

    return (
      <section className="space-y-4 py-8 text-center">
        <h1 className="text-xl font-semibold">
          {isNotFound ? t("productDetail.notFound") : t("error.title")}
        </h1>
        {!isNotFound && <p className="text-destructive">{message}</p>}
        <Button asChild variant="outline">
          <Link to="/">{t("cart.back")}</Link>
        </Button>
      </section>
    );
  }

  if (!product) return null;

  const rating = Number(product.rating);
  const price = Number(product.price);
  const inStock = product.countInStock > 0;

  const handleAddToCart = () => {
    dispatch(
      addItem({
        productId: product.id,
        quantity: 1,
        title: product.title,
        price,
        countInStock: product.countInStock,
        imageUrl: resolveProductImageUrl(product.images[0]) ?? undefined,
      })
    );
    toast.success(t("productDetail.addedToCart"), {
      action: {
        label: t("productDetail.goToCart"),
        onClick: () => navigate("/cart"),
      },
    });
  };

  const handleRemoveFromCart = () => {
    dispatch(removeItem(product.id));
    toast.success(t("productDetail.removedFromCart"));
  };

  return (
    <section className="space-y-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ProductImages images={product.images} title={product.title} />

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.title}
            </h1>

            {product.numReviews > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">
                    {rating.toFixed(1)}
                  </span>
                </div>
                <span>
                  ({product.numReviews}{" "}
                  {product.numReviews === 1
                    ? t("productCard.review")
                    : t("productCard.reviews")}
                  )
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("productDetail.noRatingsYet")}
              </p>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t("productDetail.buyBox")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-semibold">
                {formatCurrency(price)}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {t("productDetail.status")}:{" "}
                </span>
                <span
                  className={
                    inStock
                      ? "font-medium text-emerald-600"
                      : "font-medium text-destructive"
                  }
                >
                  {inStock
                    ? t("productDetail.inStock")
                    : t("productDetail.outOfStock")}
                </span>
              </p>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={!inStock}
                variant={inCart ? "outline" : "default"}
                onClick={inCart ? handleRemoveFromCart : handleAddToCart}
              >
                {inCart
                  ? t("productDetail.removeFromCart")
                  : t("productDetail.addToCart")}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("productDetail.description")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">{t("productDetail.reviews")}</h2>

        {isAuthenticated && !alreadyReviewed && (
          <ProductReviewForm productId={product.id} />
        )}

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            {t("productDetail.signInToReview")}{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`}
              className="text-primary hover:underline"
            >
              {t("nav.login")}
            </Link>
          </p>
        )}

        {isAuthenticated && alreadyReviewed && (
          <p className="text-sm text-muted-foreground">
            {t("productDetail.alreadyReviewed")}
          </p>
        )}

        <ProductReviewList reviews={reviews} />
      </div>
    </section>
  );
}

export default ProductDetailPage;
