import type { TFunction } from "i18next";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: t("auth.emailRequired") })
      .refine((value) => emailRegex.test(value), {
        message: t("auth.emailInvalid"),
      }),
    password: z
      .string()
      .min(1, { message: t("auth.passwordRequired") })
      .min(6, { message: t("auth.passwordMin") }),
  });
}

export function getRegisterSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: t("auth.nameRequired") })
      .min(2, { message: t("auth.nameMin") }),
    email: z
      .string()
      .trim()
      .min(1, { message: t("auth.emailRequired") })
      .refine((value) => emailRegex.test(value), {
        message: t("auth.emailInvalid"),
      }),
    password: z
      .string()
      .min(1, { message: t("auth.passwordRequired") })
      .min(6, { message: t("auth.passwordMin") }),
    storeTerms: z.boolean().refine((value) => value === true, {
      message: t("auth.storeTermsRequired"),
    }),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;
