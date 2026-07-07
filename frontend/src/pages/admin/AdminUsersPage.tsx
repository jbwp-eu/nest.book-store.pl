import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteUser, fetchAdminUsers } from "@/api/users";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import { formatOrderId } from "@/lib/format-date";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import type { AdminUser } from "@/types/user";

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        isAdmin
          ? "bg-primary/10 text-primary"
          : "border text-muted-foreground"
      )}
    >
      {isAdmin ? t("admin.users.admin") : t("admin.users.user")}
    </span>
  );
}

function AdminUserRow({
  user,
  onDelete,
  isDeleting,
}: {
  user: AdminUser;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 font-mono text-sm">{formatOrderId(user.id)}</td>
      <td className="px-4 py-3 text-center text-sm">{user.name}</td>
      <td className="px-4 py-3 text-center text-sm">{user.email}</td>
      <td className="px-4 py-3 text-center text-sm">
        <RoleBadge isAdmin={user.isAdmin} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/admin/users/${user.id}/edit`}>
              <Pencil className="size-4" />
              {t("admin.users.edit")}
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting || user.isAdmin}
            onClick={() => onDelete(user.id)}
            title={user.isAdmin ? t("admin.users.cannotDeleteAdmin") : undefined}
          >
            <Trash2 className="size-4" />
            {t("admin.users.delete")}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AdminUsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const locale = useAppSelector((state) => state.ui.language);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.users(locale),
    queryFn: async ({ signal }) => {
      try {
        return await fetchAdminUsers(locale, signal);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return [];
        }
        throw err;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId, locale),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users(locale) });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("admin.users.deleteFailed");
      toast.error(message);
    },
  });

  const handleDelete = (userId: string) => {
    if (!window.confirm(t("admin.users.deleteConfirm"))) return;
    deleteMutation.mutate(userId);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">{t("admin.users.loading")}</p>;
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.message : t("error.unknown");
    return <p className="text-destructive">{message}</p>;
  }

  const users = data ?? [];

  if (users.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("admin.users.title")}</h2>
        <p className="text-muted-foreground">{t("admin.users.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("admin.users.title")}</h2>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">{t("admin.users.id")}</th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.users.name")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.users.email")}
              </th>
              <th className="px-4 py-3 text-center font-medium">
                {t("admin.users.role")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("admin.users.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <AdminUserRow
                key={user.id}
                user={user}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
