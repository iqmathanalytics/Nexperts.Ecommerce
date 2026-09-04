"use client";

import { useEffect, useState } from "react";
import { INTRO_UNLOCKED_EVENT, introGateOpen } from "@/lib/splash";

/**
 * Becomes true after the home intro unlocks (or immediately if intro already seen / not home).
 * Use to defer non-critical client fetches competing with LCP.
 */
export function useIntroReady(delayMs = 0) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    const arm = () => {
      if (timer) window.clearTimeout(timer);
      if (delayMs <= 0) {
        setReady(true);
        return;
      }
      timer = window.setTimeout(() => setReady(true), delayMs);
    };

    if (introGateOpen()) {
      arm();
      return () => {
        if (timer) window.clearTimeout(timer);
      };
    }

    const onUnlock = () => arm();
    window.addEventListener(INTRO_UNLOCKED_EVENT, onUnlock);
    // Failsafe if unlock event was missed.
    const failsafe = window.setTimeout(arm, 4500);

    return () => {
      window.removeEventListener(INTRO_UNLOCKED_EVENT, onUnlock);
      window.clearTimeout(failsafe);
      if (timer) window.clearTimeout(timer);
    };
  }, [delayMs]);

  return ready;
}
