import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/api/users";
import { getAuthToken } from "@/lib/auth-token";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

export function useCurrentUser() {
  const locale = useAppSelector((state) => state.ui.language);
  const token = getAuthToken();
  const isAuthenticated = Boolean(token && token !== "EXPIRED");

  return useQuery({
    queryKey: queryKeys.users.me(locale, isAuthenticated ? token : null),
    queryFn: ({ signal }) => fetchCurrentUser(locale, signal),
    enabled: isAuthenticated,
    retry: false,
  });
}
