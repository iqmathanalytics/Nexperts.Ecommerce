/** First-visit home intro only. Product pages paint immediately. */
export const SPLASH_HOLD_MS = 2000;
export const SPLASH_EXIT_MS = 0.4;
export const SPLASH_REDUCED_MS = 600;
export const INTRO_PENDING_CLASS = "nx-intro-pending";
export const INTRO_SEEN_KEY = "nx-intro-seen";

export function splashHoldMs() {
  if (typeof window === "undefined") return SPLASH_HOLD_MS;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? SPLASH_REDUCED_MS : SPLASH_HOLD_MS;
}

export function introAlreadySeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearIntroPending() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(INTRO_PENDING_CLASS);
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
