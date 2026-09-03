/** First-visit home intro: brand plays, holds 2s, then the store reveals. */
export const SPLASH_LETTER_IN_MS = 1100;
export const SPLASH_HOLD_MS = 2000;
export const SPLASH_EXIT_MS = 0.45;
export const SPLASH_REDUCED_MS = 800;
export const INTRO_PENDING_CLASS = "nx-intro-pending";
export const INTRO_SEEN_KEY = "nx-intro-seen";

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Full time the opening cover stays up before fade-out begins. */
export function splashTotalMs() {
  if (prefersReducedMotion()) return SPLASH_REDUCED_MS;
  return SPLASH_LETTER_IN_MS + SPLASH_HOLD_MS;
}

/** Hold after the brand mark has finished animating in. */
export function splashHoldMs() {
  if (prefersReducedMotion()) return SPLASH_REDUCED_MS;
  return SPLASH_HOLD_MS;
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
