import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  ADMIN_FRONTEND_URL: z.string().default("http://localhost:3000"),
  SITE_NAME: z.string().default("Nexperts"),
  EMAIL_FROM: z.string().default("noreply@nexperts.com"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET_NAME: z.string().optional().default(""),
  R2_PUBLIC_BASE_URL: z.string().optional().default(""),
  R2_ENDPOINT: z.string().optional().default(""),
  PAYMENT_PROVIDER: z.string().default("cod"),
  PAYMENT_KEY: z.string().optional().default(""),
  PAYMENT_SECRET: z.string().optional().default(""),
  TAX_RATE: z.coerce.number().default(0.18),
  FREE_SHIPPING_MIN: z.coerce.number().default(999),
  SHIPPING_FLAT: z.coerce.number().default(49),
  REVALIDATE_SECRET: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
