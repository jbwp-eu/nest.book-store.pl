import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { loginUser } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/apiClient";
import { getLoginSchema, type LoginFormValues } from "@/lib/auth-schemas";
import { setAuthToken } from "@/lib/auth-token";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);

  const schema = useMemo(() => getLoginSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver,
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginUser(values, locale),
    onSuccess: async (data) => {
      setAuthToken(data.token, 60);
      dispatch(
        setCredentials({
          id: null,
          name: data.name,
          email: data.email,
          isAdmin: data.isAdmin,
        })
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all }),
      ]);
      toast.success(data.message || t("auth.loginSuccess"));

      const redirect = searchParams.get("redirect");
      const safeRedirect =
        redirect?.startsWith("/") && !redirect.startsWith("//")
          ? redirect
          : "/";
      navigate(safeRedirect, { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t("auth.loginFailed");
      toast.error(message);
    },
  });

  return (
    <section className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("auth.email")}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t("auth.password")}</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("auth.loggingIn") : t("auth.loginSubmit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t("auth.registerLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default LoginPage;
