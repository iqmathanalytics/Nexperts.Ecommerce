type ErrorContext = Record<string, unknown>;

export function reportClientError(error: unknown, context?: ErrorContext) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error("[client-error]", message, { stack, ...context });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nexperts:error", {
        detail: { message, stack, ...context },
      }),
    );
  }
}
