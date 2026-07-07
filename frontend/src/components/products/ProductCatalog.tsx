import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/apiClient";
import { useProducts } from "@/hooks/useProducts";
import { useProductFilterUrl } from "@/hooks/useProductFilterUrl";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";
import ProductSort from "@/components/products/ProductSort";
import ProductSearch from "@/components/products/ProductSearch";
import Pagination from "@/components/products/Pagination";

function ProductCatalog() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, isFetching } = useProducts();
  const { currentParams } = useProductFilterUrl();

  const message =
    error instanceof ApiError ? error.message : t("error.unknown");

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("home.title")}</h1>
        {isFetching && !isLoading && (
          <span className="text-xs text-muted-foreground">{t("home.refreshing")}</span>
        )}
      </div>

      <ProductSearch />

      <div className="grid gap-6 md:grid-cols-[minmax(0,11rem)_1fr]">
        <ProductFilters
          rating={currentParams.rating ?? "any"}
          price={currentParams.price ?? "any"}
        />

        <div>
          <ProductSort
            order={currentParams.order}
            category={currentParams.category}
          />

          {isLoading && (
            <p className="text-muted-foreground">{t("home.loadingProducts")}</p>
          )}

          {isError && (
            <p className="text-destructive">
              {t("home.apiError")}: {message}
            </p>
          )}

          {data && data.products.length === 0 && (
            <p className="text-muted-foreground">{t("home.noResults")}</p>
          )}

          {data && data.products.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination pages={data.pages} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductCatalog;
