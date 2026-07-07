import type { TFunction } from "i18next";
import { z } from "zod";

export function getShippingSchema(t: TFunction) {
  return z.object({
    address: z
      .string()
      .trim()
      .min(1, { message: t("shipping.validation.required") }),
    city: z
      .string()
      .trim()
      .min(1, { message: t("shipping.validation.required") }),
    code: z
      .string()
      .trim()
      .min(1, { message: t("shipping.validation.required") }),
  });
}

export type ShippingFormValues = z.infer<ReturnType<typeof getShippingSchema>>;
