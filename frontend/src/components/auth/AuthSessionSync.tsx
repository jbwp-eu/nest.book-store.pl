import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAuthToken } from "@/lib/auth-token";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch } from "@/store/hooks";
import { logout, setCredentials } from "@/store/authSlice";

function AuthSessionSync() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    const token = getAuthToken();
    if (token === "EXPIRED") {
      dispatch(logout());
      queryClient.removeQueries({ queryKey: queryKeys.users.all });
      queryClient.removeQueries({ queryKey: queryKeys.reviews.all });
    }
  }, [dispatch, queryClient]);

  useEffect(() => {
    if (currentUser) {
      dispatch(setCredentials(currentUser));
    }
  }, [currentUser, dispatch]);

  return null;
}

export default AuthSessionSync;
