import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProductEditSchema,
  type ProductEditFormValues,
} from "@/lib/product-edit-schema";
import { cn } from "@/lib/utils";
import { resolveProductImageUrl } from "@/utils/imageUrl";
import type { Product } from "@/types/product";

const MAX_IMAGES = 2;

type ProductEditFormProps = {
  product: Product;
  onSubmit: (values: ProductEditFormValues, files: FileUploads) => void;
  isSubmitting: boolean;
};

export type FileUploads = {
  images: File[];
  banners: File[];
};

function ProductEditForm({
  product,
  onSubmit,
  isSubmitting,
}: ProductEditFormProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => getProductEditSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const imagesInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductEditFormValues>({
    resolver,
    defaultValues: {
      title: product.title,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      countInStock: product.countInStock,
      isFeatured: Boolean(product.isFeatured),
    },
  });

  const isFeatured = watch("isFeatured");
  const imagesLimitReached = imageFiles.length >= MAX_IMAGES;

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    if (chosen.length === 0) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      toastLimit(MAX_IMAGES);
      return;
    }

    const nextFiles = chosen.slice(0, remaining);
    if (chosen.length > remaining) {
      toastLimit(MAX_IMAGES);
    }

    nextFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const toastLimit = (count: number) => {
    window.alert(t("admin.productEdit.imageLimit", { count }));
  };

  const submitHandler = (values: ProductEditFormValues) => {
    onSubmit(values, {
      images: imageFiles,
      banners: bannerFile ? [bannerFile] : [],
    });
  };

  const currentImages = product.images
    .map((image) => resolveProductImageUrl(image))
    .filter((url): url is string => Boolean(url));

  const currentBanner = product.banners?.[0]
    ? resolveProductImageUrl(product.banners[0])
    : null;

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <h2 className="text-lg font-semibold">{t("admin.productEdit.title")}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">{t("admin.productEdit.fields.title")}</Label>
          <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">
            {t("admin.productEdit.fields.category")}
          </Label>
          <Input
            id="category"
            {...register("category")}
            aria-invalid={!!errors.category}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="countInStock">
            {t("admin.productEdit.fields.stock")}
          </Label>
          <Input
            id="countInStock"
            type="number"
            min={0}
            step={1}
            {...register("countInStock", { valueAsNumber: true })}
            aria-invalid={!!errors.countInStock}
          />
          {errors.countInStock && (
            <p className="text-sm text-destructive">
              {errors.countInStock.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">{t("admin.productEdit.fields.price")}</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step="any"
            {...register("price", { valueAsNumber: true })}
            aria-invalid={!!errors.price}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t("admin.productEdit.fields.description")}
        </Label>
        <textarea
          id="description"
          rows={5}
          className={cn(
            "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
            errors.description && "border-destructive"
          )}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">{t("admin.productEdit.currentImages")}</p>
        {currentImages.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {currentImages.map((url) => (
              <img
                key={url}
                src={url}
                alt={t("admin.productEdit.previewAlt")}
                className="h-24 w-24 rounded-md border object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("admin.productEdit.noImages")}
          </p>
        )}

        <input
          ref={imagesInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImagesChange}
          disabled={imagesLimitReached}
        />
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((url) => (
              <img
                key={url}
                src={url}
                alt={t("admin.productEdit.previewAlt")}
                className="h-24 w-24 rounded-md border object-cover"
              />
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={imagesLimitReached}
          onClick={() => imagesInputRef.current?.click()}
        >
          {imagesLimitReached
            ? t("admin.productEdit.imagesLoaded")
            : t("admin.productEdit.pickImages")}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 rounded border"
              {...register("isFeatured")}
            />
            {t("admin.productEdit.featured")}
          </label>

          {isFeatured && (
            <div className="space-y-3">
              {currentBanner && !bannerPreview && (
                <img
                  src={currentBanner}
                  alt={t("admin.productEdit.previewAlt")}
                  className="h-32 max-w-full rounded-md border object-cover"
                />
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
                disabled={Boolean(bannerFile)}
              />
              {bannerPreview && (
                <img
                  src={bannerPreview}
                  alt={t("admin.productEdit.previewAlt")}
                  className="h-32 max-w-full rounded-md border object-cover"
                />
              )}
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(bannerFile)}
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerFile
                  ? t("admin.productEdit.bannerLoaded")
                  : t("admin.productEdit.pickBanner")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("admin.productEdit.saving")
            : t("admin.productEdit.save")}
        </Button>
      </div>
    </form>
  );
}

export default ProductEditForm;
