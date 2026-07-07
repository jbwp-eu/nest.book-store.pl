import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthToken } from "@/lib/auth-token";
import {
  hasLocalAuthSession,
  isStripePaymentSuccessPath,
} from "@/lib/auth-session";

function ProtectedRoute() {
  const location = useLocation();
  const token = getAuthToken();
  const isPaymentSuccessReturn = isStripePaymentSuccessPath(location.pathname);

  const isAuthenticated =
    (token && token !== "EXPIRED") ||
    (isPaymentSuccessReturn && hasLocalAuthSession());

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
