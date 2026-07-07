import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";
import type { AppLocale } from "@/lib/locale";
import type {
  UpdateProfileInput,
  UpdateProfileResponse,
} from "@/lib/profile-schema";
import type {
  AdminUser,
  AdminUserDetails,
  UpdateUserInput,
} from "@/types/user";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export type AuthResponse = {
  message: string;
  name: string;
  email: string;
  isAdmin: boolean;
  token: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export function fetchCurrentUser(
  locale: AppLocale,
  signal?: AbortSignal
): Promise<CurrentUser> {
  return apiGet<CurrentUser>("users/me", { locale, auth: true, signal });
}

export function loginUser(
  body: LoginInput,
  locale: AppLocale
): Promise<AuthResponse> {
  return apiPost<AuthResponse>("users/login", body, { locale });
}

export function registerUser(
  body: RegisterInput,
  locale: AppLocale
): Promise<AuthResponse> {
  return apiPost<AuthResponse>("users/register", body, { locale });
}

export function fetchAdminUsers(
  locale: AppLocale,
  signal?: AbortSignal
): Promise<AdminUser[]> {
  return apiGet<AdminUser[]>("users", { locale, auth: true, signal });
}

export function deleteUser(
  userId: string,
  locale: AppLocale
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`users/${userId}`, {
    locale,
    auth: true,
  });
}

export function fetchAdminUser(
  userId: string,
  locale: AppLocale,
  signal?: AbortSignal
): Promise<AdminUserDetails> {
  return apiGet<AdminUserDetails>(`users/${userId}`, {
    locale,
    auth: true,
    signal,
  });
}

export function updateUser(
  userId: string,
  body: UpdateUserInput,
  locale: AppLocale
): Promise<{ message: string }> {
  return apiPut<{ message: string }>(`users/${userId}`, body, {
    locale,
    auth: true,
  });
}

export function updateProfile(
  body: UpdateProfileInput,
  locale: AppLocale
): Promise<UpdateProfileResponse> {
  return apiPut<UpdateProfileResponse>("users/profile", body, {
    locale,
    auth: true,
  });
}
