import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { registerUser } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/apiClient";
import { getRegisterSchema, type RegisterFormValues } from "@/lib/auth-schemas";
import { setAuthToken } from "@/lib/auth-token";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);

  const schema = useMemo(() => getRegisterSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver,
    defaultValues: { name: "", email: "", password: "", storeTerms: false },
  });

  const mutation = useMutation({
    mutationFn: ({ storeTerms: _storeTerms, ...values }: RegisterFormValues) =>
      registerUser(values, locale),
    onSuccess: async (data) => {
      setAuthToken(data.token, 60);
      dispatch(
        setCredentials({
          id: null,
          name: data.name,
          email: data.email,
          isAdmin: data.isAdmin,
        }),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all }),
      ]);
      toast.success(data.message || t("auth.registerSuccess"));
      navigate("/", { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t("auth.registerFailed");
      toast.error(message);
    },
  });

  return (
    <section className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.registerTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="register-name">{t("auth.name")}</Label>
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">{t("auth.email")}</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">{t("auth.password")}</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <input
                  id="register-storeTerms"
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border border-input"
                  aria-invalid={Boolean(errors.storeTerms)}
                  {...register("storeTerms")}
                />
                <Label
                  htmlFor="register-storeTerms"
                  className="text-sm font-normal leading-snug"
                >
                  {t("auth.storeTerms")}{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    {t("auth.termsLink")}
                  </Link>
                </Label>
              </div>
              {errors.storeTerms && (
                <p className="text-sm text-destructive">
                  {errors.storeTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? t("auth.registering")
                : t("auth.registerSubmit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline">
              {t("auth.loginLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default RegisterPage;
