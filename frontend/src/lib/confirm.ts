/** Browser confirm for destructive admin actions (archive / delete / deactivate). */
export function confirmAction(message: string) {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}
