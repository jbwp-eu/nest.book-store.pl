import type { TFunction } from "i18next";
import { z } from "zod";

export function getProductEditSchema(t: TFunction) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, { message: t("admin.productEdit.validation.required") }),
    description: z
      .string()
      .trim()
      .min(1, { message: t("admin.productEdit.validation.required") }),
    category: z
      .string()
      .trim()
      .min(1, { message: t("admin.productEdit.validation.required") }),
    price: z
      .number({ message: t("admin.productEdit.validation.price") })
      .min(0, { message: t("admin.productEdit.validation.price") }),
    countInStock: z
      .number({ message: t("admin.productEdit.validation.stock") })
      .int()
      .min(0, { message: t("admin.productEdit.validation.stock") }),
    isFeatured: z.boolean(),
  });
}

export type ProductEditFormValues = z.infer<
  ReturnType<typeof getProductEditSchema>
>;

export type UpdateProductResponse = {
  message: string;
  page: number;
};
