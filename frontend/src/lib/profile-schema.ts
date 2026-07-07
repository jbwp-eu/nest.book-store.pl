import type { TFunction } from "i18next";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getProfileSchema(t: TFunction) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: t("profile.nameRequired") })
        .min(2, { message: t("profile.nameMin") }),
      email: z
        .string()
        .trim()
        .min(1, { message: t("profile.emailRequired") })
        .refine((value) => emailRegex.test(value), {
          message: t("profile.emailInvalid"),
        }),
      password: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.password.length > 0 && values.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          message: t("profile.passwordMin"),
          path: ["password"],
        });
      }
      if (values.password.length > 0 && values.confirmPassword !== values.password) {
        ctx.addIssue({
          code: "custom",
          message: t("profile.passwordMismatch"),
          path: ["confirmPassword"],
        });
      }
    });
}

export type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

export type UpdateProfileResponse = {
  message: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export type UpdateProfileInput = {
  name: string;
  email: string;
  password?: string;
};
