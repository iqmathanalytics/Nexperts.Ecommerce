export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...(meta ? { meta } : {}) };
}

export function fail(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}

export type AuthedUser = {
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
  kind: "customer" | "admin";
};
