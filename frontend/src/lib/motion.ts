export const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

export const drawer = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring" as const, stiffness: 320, damping: 32 },
};

export const modal = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

export const heartPop = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.25, 1] },
  transition: { duration: 0.35 },
};

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const offerModal = {
  initial: { opacity: 0, scale: 0.86, y: 48, rotateX: 12 },
  animate: { opacity: 1, scale: 1, y: 0, rotateX: 0 },
  exit: { opacity: 0, scale: 0.9, y: 64, rotateX: -8, filter: "blur(8px)" },
  transition: { duration: 0.55, ease: easeOut },
};

export const offerDock = {
  initial: { opacity: 0, y: 80, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 90, scale: 0.92, filter: "blur(6px)" },
  transition: { type: "spring" as const, stiffness: 280, damping: 26 },
};

export function isModifiedClick(e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; button: number }) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}
