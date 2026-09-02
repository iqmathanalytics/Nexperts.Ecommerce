/** Soft same-origin flags for Next middleware. Real JWTs stay HttpOnly on the API host. */

const WEEK = 60 * 60 * 24 * 7;

export const SESSION_GATES = {
  admin: "admin_session",
  customer: "customer_session",
} as const;

export type SessionGate = keyof typeof SESSION_GATES;

function secureFlag() {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
}

export function setSessionGate(kind: SessionGate) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_GATES[kind]}=1; Path=/; Max-Age=${WEEK}; SameSite=Lax${secureFlag()}`;
}

export function clearSessionGate(kind: SessionGate) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_GATES[kind]}=; Path=/; Max-Age=0; SameSite=Lax${secureFlag()}`;
}
