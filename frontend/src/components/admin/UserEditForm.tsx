import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUserEditSchema,
  type UserEditFormValues,
} from "@/lib/user-edit-schema";
import type { AdminUserDetails } from "@/types/user";

type UserEditFormProps = {
  user: AdminUserDetails;
  onSubmit: (values: UserEditFormValues) => void;
  isSubmitting: boolean;
};

function UserEditForm({ user, onSubmit, isSubmitting }: UserEditFormProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => getUserEditSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserEditFormValues>({
    resolver,
    defaultValues: {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold">{t("admin.userEdit.title")}</h2>

      <div className="space-y-2">
        <Label htmlFor="email">{t("admin.userEdit.fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("admin.userEdit.fields.name")}</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 rounded border"
          {...register("isAdmin")}
        />
        {t("admin.userEdit.fields.isAdmin")}
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("admin.userEdit.saving") : t("admin.userEdit.save")}
        </Button>
      </div>
    </form>
  );
}

export default UserEditForm;
