import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import ProductCatalog from "@/components/products/ProductCatalog";
import ProductCarousel from "@/components/products/ProductCarousel";

function FeaturedStrip() {
  const { data, isLoading, isError } = useFeaturedProducts();

  if (isLoading || isError || !data?.length) return null;

  const slides = data
    .filter((product) => product.banners?.length)
    .flatMap((product) =>
      (product.banners ?? []).map((banner) => ({
        productId: product.id,
        banner,
        title: product.title,
      })),
    );

  if (!slides.length) return null;

  return <ProductCarousel items={slides} />;
}

function HomePage() {
  return (
    <>
      <FeaturedStrip />
      <ProductCatalog />
    </>
  );
}

export default HomePage;
