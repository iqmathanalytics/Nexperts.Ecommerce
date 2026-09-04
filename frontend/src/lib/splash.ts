/** First-visit home intro: brand plays, holds, then the store reveals. */
export const SPLASH_LETTER_IN_MS = 1100;
/** Slightly shorter hold for production feel without removing the intro. */
export const SPLASH_HOLD_MS = 1400;
export const SPLASH_EXIT_MS = 0.45;
export const SPLASH_REDUCED_MS = 800;
/** Hard unlock even if Framer Motion exit never completes. */
export const SPLASH_FAILSAFE_MS = 4000;
export const INTRO_PENDING_CLASS = "nx-intro-pending";
export const INTRO_SEEN_KEY = "nx-intro-seen";
/** Fired when intro unlocks so deferred client work can start. */
export const INTRO_UNLOCKED_EVENT = "nx-intro-unlocked";

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
  const had = document.documentElement.classList.contains(INTRO_PENDING_CLASS);
  document.documentElement.classList.remove(INTRO_PENDING_CLASS);
  if (had && typeof window !== "undefined") {
    window.dispatchEvent(new Event(INTRO_UNLOCKED_EVENT));
  }
}

/** True when intro is done or was never needed — safe to start non-critical fetches. */
export function introGateOpen() {
  if (typeof document === "undefined") return true;
  if (introAlreadySeen()) return true;
  return !document.documentElement.classList.contains(INTRO_PENDING_CLASS);
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
