const DEFAULT_AFTER_LOGIN = "/account/profile";

const BLOCKED_NEXT = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/admin/login",
]);

function isSafeInternalPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.startsWith("/admin")) return false;
  const bare = path.split("?")[0]?.split("#")[0] ?? path;
  if (BLOCKED_NEXT.has(bare)) return false;
  return true;
}

/** Build /login?next=… for protected actions. Defaults to the member profile. */
export function loginUrl(next?: string) {
  const path = next && isSafeInternalPath(next) ? next : DEFAULT_AFTER_LOGIN;
  return `/login?next=${encodeURIComponent(path)}`;
}

/** Resolve the post-login destination. Defaults to /account/profile. */
export function safeNextPath(next: string | null | undefined) {
  if (!next) return DEFAULT_AFTER_LOGIN;
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    decoded = next;
  }
  if (!isSafeInternalPath(decoded)) return DEFAULT_AFTER_LOGIN;
  return decoded;
}

export { DEFAULT_AFTER_LOGIN };
