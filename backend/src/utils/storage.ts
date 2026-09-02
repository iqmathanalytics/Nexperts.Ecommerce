import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env";
import { AppError } from "../utils/http";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function r2Enabled() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}

function client() {
  const endpoint = env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export function assertImage(file: Express.Multer.File) {
  if (!ALLOWED.has(file.mimetype)) {
    throw new AppError("INVALID_FILE_TYPE", "Only JPEG, PNG, WEBP and GIF images are allowed", 400);
  }
  if (file.size > MAX_BYTES) {
    throw new AppError("FILE_TOO_LARGE", "Image must be 5MB or smaller", 400);
  }
}

export async function uploadImage(file: Express.Multer.File, folder: string) {
  assertImage(file);
  const ext = file.mimetype.split("/")[1] === "jpeg" ? "jpg" : file.mimetype.split("/")[1];
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  if (r2Enabled()) {
    await client().send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
    const url = base ? `${base}/${key}` : `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;
    return { key, url };
  }

  const destDir = path.join(process.cwd(), "uploads", folder);
  await fs.mkdir(destDir, { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "uploads", key), file.buffer);
  const origin = env.FRONTEND_URL.includes("localhost") || env.FRONTEND_URL.includes("127.0.0.1")
    ? `http://localhost:${env.PORT}`
    : env.FRONTEND_URL;
  return { key, url: `${origin.replace(/\/$/, "")}/uploads/${key}` };
}

export async function deleteImage(key: string) {
  if (r2Enabled()) {
    await client().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
    return;
  }
  await fs.unlink(path.join(process.cwd(), "uploads", key)).catch(() => undefined);
}
