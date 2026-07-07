import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth-token";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const token = getAuthToken();
  const isAuthenticated = Boolean(token && token !== "EXPIRED");

  const logout = () => {
    dispatch(logoutAction());
    queryClient.removeQueries({ queryKey: queryKeys.users.all });
    queryClient.removeQueries({ queryKey: queryKeys.reviews.all });
  };

  return {
    userInfo,
    isAuthenticated,
    isLoggedIn: Boolean(userInfo.email),
    logout,
  };
}
