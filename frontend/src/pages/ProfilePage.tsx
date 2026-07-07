import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { updateProfile } from "@/api/users";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/apiClient";
import {
  getProfileSchema,
  type ProfileFormValues,
} from "@/lib/profile-schema";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

function ProfilePage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const { data: user, isLoading } = useCurrentUser();

  const schema = useMemo(() => getProfileSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    values: user
      ? {
          name: user.name,
          email: user.email,
          password: "",
          confirmPassword: "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) => {
      const body = {
        name: values.name.trim(),
        email: values.email.trim(),
        ...(values.password.trim() ? { password: values.password } : {}),
      };
      return updateProfile(body, locale);
    },
    onSuccess: (result) => {
      dispatch(
        setCredentials({
          id: user?.id ?? userInfo.id,
          name: result.name,
          email: result.email,
          isAdmin: result.isAdmin,
        })
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      reset({
        name: result.name,
        email: result.email,
        password: "",
        confirmPassword: "",
      });
      toast.success(result.message || t("profile.updateSuccess"));
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t("profile.updateFailed");
      toast.error(message);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">{t("auth.profileLoading")}</p>;
  }

  if (!user) return null;

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("auth.profileTitle")}
      </h1>

      {user.isAdmin && (
        <p className="text-sm text-muted-foreground">{t("auth.adminBadge")}</p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">{t("profile.formTitle")}</h2>

          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="profile-email">{t("auth.email")}</Label>
              <Input
                id="profile-email"
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
              <Label htmlFor="profile-name">{t("auth.name")}</Label>
              <Input
                id="profile-name"
                type="text"
                autoComplete="name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password">{t("profile.newPassword")}</Label>
              <Input
                id="profile-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.passwordHint")}
              </p>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-confirm-password">
                {t("profile.confirmPassword")}
              </Label>
              <Input
                id="profile-confirm-password"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default ProfilePage;
