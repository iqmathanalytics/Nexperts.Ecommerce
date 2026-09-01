export function loginUrl(next?: string) {
  const path = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return `/login?next=${encodeURIComponent(path)}`;
}

export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/admin")) return "/account";
  return next;
}
