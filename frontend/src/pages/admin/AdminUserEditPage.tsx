import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fetchAdminUser, updateUser } from "@/api/users";
import UserEditForm from "@/components/admin/UserEditForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import type { UserEditFormValues } from "@/lib/user-edit-schema";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

function AdminUserEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);
  const { id } = useParams<{ id: string }>();

  const userId = id ?? "";
  const backLink = useMemo(() => "/admin/users", []);

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.admin.userDetail(locale, userId),
    queryFn: ({ signal }) => fetchAdminUser(userId, locale, signal),
    enabled: Boolean(userId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UserEditFormValues) => updateUser(userId, values, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      navigate(backLink);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.userEdit.saveFailed");
      toast.error(message);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">{t("admin.userEdit.loading")}</p>;
  }

  if (isError || !user) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return (
      <section className="space-y-4">
        <p className="text-destructive">{message}</p>
        <Button asChild variant="outline">
          <Link to={backLink}>{t("admin.userEdit.back")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <Button asChild variant="outline">
        <Link to={backLink}>{t("admin.userEdit.back")}</Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          <UserEditForm
            user={user}
            isSubmitting={updateMutation.isPending}
            onSubmit={(values) => updateMutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  );
}

export default AdminUserEditPage;
