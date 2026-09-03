import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { clearSessionGate, setSessionGate } from "@/lib/sessionGate";

/** Confirm the HttpOnly JWT stuck, set the soft gate, and merge any guest bag. */
export async function establishCustomerSession(user: User) {
  setSessionGate("customer");

  const me = await api<{ user: User | null }>("/auth/me");
  if (!me.data.user) {
    clearSessionGate("customer");
    throw new Error("Signed in, but the browser blocked the session cookie. Allow cookies for this site and try again.");
  }

  try {
    const { readGuestCart, clearGuestCart } = await import("@/lib/guestCart");
    const guest = readGuestCart();
    if (guest.length) {
      await api("/cart/merge", {
        method: "POST",
        body: JSON.stringify({
          items: guest.map((g) => ({ variantId: g.variantId, quantity: g.quantity })),
        }),
      });
      clearGuestCart();
    }
  } catch {
    /* merge is best-effort */
  }

  return me.data.user ?? user;
}
