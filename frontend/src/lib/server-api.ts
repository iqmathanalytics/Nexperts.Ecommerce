import type { ApiSuccess, ApiError } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4010/api/v1";

export async function fetchPublicApi<T>(path: string, revalidateSeconds = 300): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`API ${path} failed (${res.status})`);
  const json = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data;
}
