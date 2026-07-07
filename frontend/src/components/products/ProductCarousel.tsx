import Autoplay from "embla-carousel-autoplay";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { resolveProductImageUrl } from "@/utils/imageUrl";

const AUTOPLAY_DELAY_MS = 4500;

export type BannerSlide = {
  productId: string;
  banner: string;
  title?: string;
};

type ProductCarouselProps = {
  items: BannerSlide[];
};

const BANNER_HEIGHT = "h-[120px] sm:h-[150px] md:h-[210px] lg:h-[270px]";

const NAV_BUTTON_CLASS = "my-auto bg-background/90 shadow-sm inset-y-0";

function ProductCarousel({ items }: ProductCarouselProps) {
  const { t } = useTranslation();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: AUTOPLAY_DELAY_MS,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    [],
  );

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  if (items.length === 0) return null;

  return (
    <section
      className="relative mb-8 w-full"
      aria-label={t("carousel.featured")}
    >
      <h2 className="sr-only">{t("carousel.featured")}</h2>
      <Carousel
        className="w-full"
        opts={{ loop: items.length > 1 }}
        plugins={items.length > 1 ? [autoplay] : undefined}
        setApi={setApi}
      >
        <div className={cn("relative w-full flex items-center", BANNER_HEIGHT)}>
          <CarouselContent className="ml-0 h-full">
            {items.map(({ productId, banner, title }, i) => {
              const imageUrl = resolveProductImageUrl(banner);
              return (
                <CarouselItem
                  key={`${productId}-${banner}`}
                  className="h-full pl-0 my-auto"
                >
                  <Link
                    to={`/product/${productId}`}
                    className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-card transition-opacity hover:opacity-95"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title ?? ""}
                        className="max-h-full max-w-full object-contain"
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    ) : null}
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </div>

        {items.length > 1 && (
          <>
            <CarouselPrevious
              aria-label={t("carousel.previousSlide")}
              className={cn(NAV_BUTTON_CLASS, "left-2 sm:left-4")}
            />
            <CarouselNext
              aria-label={t("carousel.nextSlide")}
              className={cn(NAV_BUTTON_CLASS, "right-2 sm:right-4")}
            />
          </>
        )}

        {items.length > 1 && (
          <div
            className="mt-1.5 flex justify-center gap-2 md:mt-1"
            role="tablist"
            aria-label={t("carousel.featured")}
          >
            {items.map((item, i) => (
              <button
                key={`${item.productId}-${item.banner}-dot`}
                type="button"
                role="tab"
                aria-label={t("carousel.goToSlide", { number: i + 1 })}
                aria-selected={current === i}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "size-2.5 rounded-full border border-border transition-colors",
                  current === i ? "bg-primary" : "bg-muted hover:bg-muted/80",
                )}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  );
}

export default ProductCarousel;
