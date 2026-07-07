const TOKEN_KEY = "token";
const EXPIRATION_KEY = "expiration";

export function getAuthToken(): string | null | "EXPIRED" {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const storedExpiration = localStorage.getItem(EXPIRATION_KEY);
  if (!storedExpiration) return null;

  const expirationDate = new Date(storedExpiration);
  const duration = expirationDate.getTime() - Date.now();

  if (duration <= 0) return "EXPIRED";
  return token;
}

export function setAuthToken(token: string, expiresInMinutes = 60): void {
  localStorage.setItem(TOKEN_KEY, token);
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + expiresInMinutes);
  localStorage.setItem(EXPIRATION_KEY, expiration.toISOString());
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRATION_KEY);
}

export function getAuthHeader(): { Authorization: string } | null {
  const token = getAuthToken();
  if (!token || token === "EXPIRED") return null;
  return { Authorization: `Bearer ${token}` };
}
