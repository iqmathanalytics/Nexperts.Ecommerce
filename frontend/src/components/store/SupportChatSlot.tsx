"use client";

import { useEffect } from "react";

/** Optional Intercom/Zendesk slot — set NEXT_PUBLIC_INTERCOM_APP_ID to enable */
export function SupportChatSlot() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;
    if (!appId || typeof window === "undefined") return;
    // Lightweight stub — replace with official Intercom snippet in production
    (window as unknown as { Intercom?: (...args: unknown[]) => void }).Intercom?.("boot", { app_id: appId });
  }, []);
  return null;
}
