import { getAuthToken } from "@/lib/auth-token";

export function hasLocalAuthSession(): boolean {
  const token = getAuthToken();
  if (token && token !== "EXPIRED") {
    return true;
  }

  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return false;

    const userInfo = JSON.parse(raw) as { name?: string; email?: string };
    return Boolean(userInfo.name && userInfo.email);
  } catch {
    return false;
  }
}

export function isStripePaymentSuccessPath(pathname: string): boolean {
  return /^\/order\/[^/]+\/payment-success$/.test(pathname);
}
