import { getAuthHeader } from "@/lib/auth-token";
import { env } from "@/lib/env";
import type { AppLocale } from "@/lib/locale";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiRequestOptions = {
  locale?: AppLocale;
  auth?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function mergeHeaders(base: Headers, extra?: HeadersInit): Headers {
  const out = new Headers(base);
  if (!extra) return out;
  const headers = new Headers(extra);
  headers.forEach((value, key) => out.set(key, value));
  return out;
}

export function buildApiHeaders(
  locale: AppLocale,
  withAuth = false,
  extra?: HeadersInit,
  options?: { omitContentType?: boolean }
): Headers {
  const base = new Headers({ "x-app-locale": locale });
  if (!options?.omitContentType) {
    base.set("Content-Type", "application/json");
  }

  const headers = mergeHeaders(base, extra);

  if (withAuth) {
    const auth = getAuthHeader();
    if (auth?.Authorization) {
      headers.set("Authorization", auth.Authorization);
    }
  }

  return headers;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? response.statusText;
    if (typeof data.message === "string") return data.message;
  } catch {
    // ignore invalid JSON body
  }
  return response.statusText || "Request failed";
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {}
): Promise<T> {
  const locale = options.locale ?? env.language;
  const url = path.startsWith("http")
    ? path
    : `${env.backendUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  // Token trafia do headers przez buildApiHeaders:
  // Jeśli 'withAuth' (options.auth) jest true, wołane jest getAuthHeader(),
  // który pobiera token (np. z localStorage/cookies), potem ustawia headers.set("Authorization", "Bearer ...")
  const headers = buildApiHeaders(
    locale,
    options.auth ?? false,
    init.headers,
    { omitContentType: init.body instanceof FormData }
  );

  const response = await fetch(url, {
    ...init,
    headers,
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(
  path: string,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { method: "GET" }, options);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options
  );
}

export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options
  );
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options
  );
}

export function apiDelete<T>(
  path: string,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" }, options);
}

export function apiPatchFormData<T>(
  path: string,
  body: FormData,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    { method: "PATCH", body },
    { ...options, headers: options?.headers }
  );
}
