import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { resolveProductImageUrl } from "@/utils/imageUrl";

type ProductImagesProps = {
  images: string[];
  title: string;
};

function ProductImages({ images, title }: ProductImagesProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        {t("productCard.noImage")}
      </div>
    );
  }

  const mainUrl = resolveProductImageUrl(images[current]);

  return (
    <div className="space-y-3">
      {mainUrl ? (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t("productDetail.enlargeImage")}
        >
          <img
            src={mainUrl}
            alt={title}
            className="aspect-[4/3] w-full cursor-zoom-in object-cover transition-opacity hover:opacity-95"
          />
        </button>
      ) : null}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          overlayClassName="cursor-zoom-out bg-black/40 backdrop-blur-[2px]"
          className="flex h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] cursor-zoom-out items-center justify-center border-0 bg-transparent p-4 shadow-none sm:max-w-none [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-background/80 [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:shadow-sm"
          showCloseButton
          onClick={() => setLightboxOpen(false)}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {mainUrl ? (
            <img
              src={mainUrl}
              alt={title}
              className="block max-h-[90vh] w-full max-w-[min(100vw-2rem,56rem)] cursor-zoom-out object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => {
            const thumbUrl = resolveProductImageUrl(image);
            if (!thumbUrl) return null;
            return (
              <button
                key={image}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn(
                  "overflow-hidden rounded-lg border-2 transition-colors",
                  current === index ? "border-primary" : "border-transparent",
                )}
              >
                <img
                  src={thumbUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductImages;
