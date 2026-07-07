import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAuthToken } from "@/lib/auth-token";

function AdminRoute() {
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const token = getAuthToken();
  const { isLoading } = useCurrentUser();

  if (!token || token === "EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !userInfo.email) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        {t("admin.loading")}
      </p>
    );
  }

  if (!userInfo.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
