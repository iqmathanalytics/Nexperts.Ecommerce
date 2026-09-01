import { API_URL } from "./utils";
import { loginUrl } from "./auth";

export type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, number> };
export type ApiError = { success: false; error: { code: string; message: string } };

export class ApiRequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function fallbackMessage(status: number) {
  if (status === 429) return "Too many sign-in attempts. Please wait a few minutes and try again.";
  if (status === 0) return "Unable to reach the server. Please try again.";
  return "Unexpected server response.";
}

export async function api<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: Record<string, number> }> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: init?.cache ?? "no-store",
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiRequestError("NETWORK_ERROR", fallbackMessage(0), 0);
  }

  let json: ApiSuccess<T> | ApiError | undefined;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiRequestError("INVALID_RESPONSE", fallbackMessage(res.status), res.status);
  }

  if (!json || typeof json !== "object" || !("success" in json)) {
    throw new ApiRequestError("INVALID_RESPONSE", fallbackMessage(res.status), res.status);
  }
  if (!json.success) {
    const code = json.error?.code ?? "REQUEST_FAILED";
    if (
      code === "UNAUTHENTICATED" &&
      typeof window !== "undefined" &&
      !path.startsWith("/auth/") &&
      !path.startsWith("/admin/auth/")
    ) {
      const current = window.location.pathname;
      if (current.startsWith("/admin")) {
        window.location.assign("/admin/login");
      } else if (current.startsWith("/account") || current.startsWith("/cart") || current.startsWith("/checkout")) {
        window.location.assign(loginUrl(current));
      }
    }
    throw new ApiRequestError(code, json.error?.message ?? "Request failed", res.status);
  }
  return { data: json.data, meta: json.meta };
}
