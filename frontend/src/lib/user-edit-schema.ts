import type { TFunction } from "i18next";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getUserEditSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: t("admin.userEdit.validation.nameRequired") })
      .min(2, { message: t("admin.userEdit.validation.nameMin") }),
    email: z
      .string()
      .trim()
      .min(1, { message: t("admin.userEdit.validation.emailRequired") })
      .refine((value) => emailRegex.test(value), {
        message: t("admin.userEdit.validation.emailInvalid"),
      }),
    isAdmin: z.boolean(),
  });
}

export type UserEditFormValues = z.infer<ReturnType<typeof getUserEditSchema>>;
